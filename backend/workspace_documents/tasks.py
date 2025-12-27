"""
Celery tasks for document processing.
"""
from celery import shared_task
from django.conf import settings


@shared_task
def process_document(document_id: int):
    """
    Process a document after upload.
    This can include generating thumbnails, extracting text, etc.
    """
    from .models import Document
    
    try:
        document = Document.objects.get(id=document_id)
        document.status = 'processing'
        document.save()
        
        # Add your document processing logic here
        # For example:
        # - Generate thumbnails for images/PDFs
        # - Extract text for search indexing
        # - Scan for viruses
        # - Convert file formats
        
        document.status = 'ready'
        document.save()
        
        return f'Document {document_id} processed successfully'
        
    except Document.DoesNotExist:
        return f'Document {document_id} not found'
    except Exception as e:
        document.status = 'error'
        document.save()
        raise e


@shared_task
def cleanup_expired_documents():
    """
    Clean up documents that failed upload.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import Document
    
    # Delete pending documents older than 24 hours
    cutoff = timezone.now() - timedelta(hours=24)
    expired = Document.objects.filter(
        status='pending',
        created_at__lt=cutoff
    )
    count = expired.count()
    expired.delete()
    
    return f'Deleted {count} expired documents'

