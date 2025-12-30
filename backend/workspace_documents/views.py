import uuid
import boto3
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core_api.permissions import IsAdminOrReadOnly
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadRequestSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents.
    Read access for all authenticated users.
    Write access for admins only.
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by shared status
        shared = self.request.query_params.get('shared')
        if shared == 'true':
            queryset = queryset.filter(is_shared=True)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_upload(self, request):
        """
        Request a presigned URL for uploading a document to S3.
        """
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check admin permission for uploads
        if not (request.user.is_admin or request.user.is_superuser or request.user.is_staff):
            return Response(
                {'error': 'Only admins can upload documents'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate unique file key
        file_name = serializer.validated_data['name']
        file_extension = file_name.rsplit('.', 1)[1] if '.' in file_name else ''
        file_key = f"documents/{uuid.uuid4()}.{file_extension}"
        
        # Create document record
        document = Document.objects.create(
            name=file_name,
            file_key=file_key,
            file_size=serializer.validated_data['file_size'],
            file_type=file_extension,
            mime_type=serializer.validated_data['file_type'],
            status='pending',
            uploaded_by=request.user
        )
        
        # Check if S3 credentials are configured
        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            document.status = 'error'
            document.save()
            return Response(
                {
                    'error': 'S3 is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file or environment variables.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Generate presigned URL for S3 upload
        try:
            # Test S3 connection first
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            
            # Verify bucket exists and is accessible
            try:
                s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            except Exception as bucket_error:
                document.status = 'error'
                document.save()
                error_str = str(bucket_error)
                if '404' in error_str or 'NoSuchBucket' in error_str:
                    error_message = f'S3 bucket "{settings.AWS_STORAGE_BUCKET_NAME}" does not exist. Please create it in AWS S3 console or update AWS_STORAGE_BUCKET_NAME in your .env file.'
                elif '403' in error_str or 'AccessDenied' in error_str:
                    error_message = f'Access denied to S3 bucket "{settings.AWS_STORAGE_BUCKET_NAME}". Please check your AWS IAM permissions.'
                elif 'InvalidAccessKeyId' in error_str or 'SignatureDoesNotMatch' in error_str:
                    error_message = 'Invalid AWS credentials. Please verify your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.'
                else:
                    error_message = f'Cannot access S3 bucket: {error_str}'
                
                return Response(
                    {'error': error_message},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': file_key,
                    'ContentType': serializer.validated_data['file_type'],
                },
                ExpiresIn=settings.AWS_QUERYSTRING_EXPIRE
            )
            
            return Response({
                'document_id': document.id,
                'upload_url': presigned_url,
                'file_key': file_key,
            })
            
        except Exception as e:
            document.status = 'error'
            document.save()
            error_message = str(e)
            # Provide more helpful error messages
            if 'InvalidAccessKeyId' in error_message or 'SignatureDoesNotMatch' in error_message:
                error_message = 'Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.'
            elif 'NoSuchBucket' in error_message:
                error_message = f'S3 bucket "{settings.AWS_STORAGE_BUCKET_NAME}" does not exist. Please create it in AWS S3 console or update AWS_STORAGE_BUCKET_NAME.'
            elif 'AccessDenied' in error_message or '403' in error_message:
                error_message = 'Access denied to S3 bucket. Please check your AWS IAM permissions.'
            elif 'ClientError' in error_message or 'BotoCoreError' in error_message:
                error_message = f'S3 connection error: {error_message}. Please verify your AWS credentials and network connection.'
            
            return Response(
                {'error': f'Failed to generate upload URL: {error_message}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def confirm_upload(self, request, pk=None):
        """Confirm that the upload to S3 was successful."""
        document = self.get_object()
        document.status = 'uploaded'
        document.save()
        
        # Trigger background processing if needed
        # process_document.delay(document.id)
        
        return Response({'status': 'confirmed'})
    
    @action(detail=True, methods=['get'])
    def download_url(self, request, pk=None):
        """Get a presigned URL for downloading the document."""
        document = self.get_object()
        
        if not document.file_key:
            return Response(
                {'error': 'Document has no file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if S3 credentials are configured
        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            return Response(
                {
                    'error': 'S3 is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file or environment variables.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': document.file_key,
                },
                ExpiresIn=settings.AWS_QUERYSTRING_EXPIRE
            )
            
            return Response({'download_url': presigned_url})
            
        except Exception as e:
            error_message = str(e)
            # Provide more helpful error messages
            if 'InvalidAccessKeyId' in error_message or 'SignatureDoesNotMatch' in error_message:
                error_message = 'Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.'
            elif 'NoSuchBucket' in error_message:
                error_message = f'S3 bucket "{settings.AWS_STORAGE_BUCKET_NAME}" does not exist. Please create it or update AWS_STORAGE_BUCKET_NAME.'
            elif 'AccessDenied' in error_message:
                error_message = 'Access denied to S3 bucket. Please check your AWS IAM permissions.'
            
            return Response(
                {'error': f'Failed to generate download URL: {error_message}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def toggle_share(self, request, pk=None):
        """Toggle the shared status of a document."""
        document = self.get_object()
        document.is_shared = not document.is_shared
        document.save()
        return Response({'is_shared': document.is_shared})
