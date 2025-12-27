from django.db import models
from django.conf import settings


class Document(models.Model):
    """Model for storing documents with S3 integration."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Upload'),
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('error', 'Error'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')  # Short description of the document
    file_key = models.CharField(max_length=500, blank=True)  # S3 key
    file_size = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=100, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_shared = models.BooleanField(default=False)
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='shared_documents'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
    
    def __str__(self):
        return self.name
    
    @property
    def file_extension(self):
        if '.' in self.name:
            return self.name.rsplit('.', 1)[1].lower()
        return ''
