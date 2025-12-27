from django.db import models
from django.conf import settings


class ToolLink(models.Model):
    """Model for storing tool links that users can access."""
    
    CATEGORY_CHOICES = [
        ('communication', 'Communication'),
        ('productivity', 'Productivity'),
        ('design', 'Design'),
        ('development', 'Development'),
        ('project_management', 'Project Management'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    icon_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tools'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tool_links'
        ordering = ['name']
        verbose_name = 'Tool Link'
        verbose_name_plural = 'Tool Links'
    
    def __str__(self):
        return self.name
