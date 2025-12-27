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
    url = models.URLField(max_length=500)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    icon_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_personal = models.BooleanField(default=False, help_text='If True, this tool is only visible to the creator')
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
    
    def save(self, *args, **kwargs):
        """Override save to ensure non-admin users always have is_personal=True."""
        # If created_by is set and the user is not an admin, force is_personal=True
        # This is the final safeguard - even if something bypasses the serializer, this will catch it
        if self.created_by:
            # Refresh created_by to ensure we have the latest user data
            try:
                self.created_by.refresh_from_db()
            except:
                pass  # If refresh fails, use what we have
            
            if not (self.created_by.is_admin or self.created_by.is_superuser or self.created_by.is_staff):
                if not self.is_personal:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Tool {self.id or 'NEW'} being saved with is_personal=False for non-admin user {self.created_by.id}. Forcing is_personal=True.")
                    self.is_personal = True
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ToolFavorite(models.Model):
    """Model for tracking which tools users have favorited/starred."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_tools'
    )
    tool = models.ForeignKey(
        ToolLink,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    order = models.IntegerField(default=0, help_text='User-defined order for displaying favorites')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tool_favorites'
        unique_together = ['user', 'tool']
        verbose_name = 'Tool Favorite'
        verbose_name_plural = 'Tool Favorites'
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.user.email} favorited {self.tool.name}"