from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_extension = serializers.ReadOnlyField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'name', 'description', 'file_key', 'file_size', 'file_type',
            'mime_type', 'status', 'is_shared', 'uploaded_by',
            'uploaded_by_name', 'file_extension', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.username
        return None


class DocumentUploadRequestSerializer(serializers.Serializer):
    """Serializer for requesting a presigned upload URL."""
    name = serializers.CharField(max_length=255)
    file_type = serializers.CharField(max_length=100)
    file_size = serializers.IntegerField()

