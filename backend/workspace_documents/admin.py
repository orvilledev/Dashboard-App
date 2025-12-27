from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'file_type', 'file_size', 'status', 'is_shared', 'uploaded_by', 'created_at')
    list_filter = ('status', 'is_shared', 'file_type', 'created_at')
    search_fields = ('name', 'file_key')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
