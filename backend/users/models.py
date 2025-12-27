from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify
import json
import re


class User(AbstractUser):
    """Custom User model that syncs with Clerk authentication."""
    
    clerk_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email or self.username
    
    @staticmethod
    def generate_username_from_email(email: str) -> str:
        """Generate a username from email address."""
        if not email:
            return None
        
        # Extract the part before @
        username = email.split('@')[0]
        # Remove any non-alphanumeric characters except dots and underscores
        username = re.sub(r'[^a-zA-Z0-9._]', '', username)
        # Limit to 150 characters (Django username max length)
        username = username[:150]
        return username or None
    
    @staticmethod
    def generate_username_from_name(first_name: str, last_name: str) -> str:
        """Generate a username from first and last name."""
        name_parts = [first_name, last_name]
        name_parts = [part.strip() for part in name_parts if part.strip()]
        
        if not name_parts:
            return None
        
        # Combine and slugify
        full_name = ' '.join(name_parts)
        username = slugify(full_name)
        # Remove hyphens and make lowercase
        username = username.replace('-', '').lower()
        # Limit to 150 characters
        username = username[:150]
        return username or None
    
    @staticmethod
    def generate_unique_username(base_username: str) -> str:
        """Generate a unique username by appending numbers if needed."""
        if not base_username:
            return None
        
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            # Append counter, but keep within 150 char limit
            suffix = f"_{counter}"
            if len(username) + len(suffix) > 150:
                username = username[:150 - len(suffix)] + suffix
            else:
                username = username + suffix
            counter += 1
            # Safety check to prevent infinite loop
            if counter > 10000:
                break
        
        return username
    
    @classmethod
    def get_or_create_from_clerk(cls, clerk_user_data: dict) -> 'User':
        """
        Get or create a user from Clerk JWT claims.
        Generates proper username from email or name, and ensures email is set.
        """
        clerk_id = clerk_user_data.get('sub')
        email = clerk_user_data.get('email', '').strip()
        first_name = clerk_user_data.get('given_name', '').strip()
        last_name = clerk_user_data.get('family_name', '').strip()
        
        # Try to get existing user
        user = None
        try:
            user = cls.objects.get(clerk_id=clerk_id)
        except cls.DoesNotExist:
            pass
        
        # Generate username
        username = None
        if email:
            # First try: username from email
            username = cls.generate_username_from_email(email)
        if not username and (first_name or last_name):
            # Second try: username from name
            username = cls.generate_username_from_name(first_name, last_name)
        if not username:
            # Fallback: use a sanitized version of clerk_id
            username = re.sub(r'[^a-zA-Z0-9._]', '', clerk_id)[:150] if clerk_id else f"user_{clerk_id[:20]}" if clerk_id else None
        
        # Ensure username is unique
        if username:
            username = cls.generate_unique_username(username)
        
        # If no username could be generated, use clerk_id as last resort
        if not username:
            username = clerk_id or f"user_{clerk_id[:20]}"
            username = cls.generate_unique_username(username)
        
        if user:
            # Update existing user - always try to improve email and username
            needs_save = False
            
            # Update email if we have one (even if user already has one, Clerk's is more authoritative)
            if email and email != user.email:
                user.email = email
                needs_save = True
            
            # Update username if it's still auto-generated (starts with 'user_' or equals clerk_id)
            # or if we can generate a better one
            is_auto_generated = (
                user.username.startswith('user_') or 
                user.username == clerk_id or
                (clerk_id and clerk_id in user.username)
            )
            
            if is_auto_generated and username and username != user.username:
                user.username = username
                needs_save = True
            
            # Update name fields if provided
            if first_name and first_name != user.first_name:
                user.first_name = first_name
                needs_save = True
            if last_name and last_name != user.last_name:
                user.last_name = last_name
                needs_save = True
            
            # Update avatar if provided
            avatar_url = clerk_user_data.get('picture', '')
            if avatar_url and avatar_url != user.avatar_url:
                user.avatar_url = avatar_url
                needs_save = True
            
            # Update admin status - but preserve manual Django admin settings
            # Only update if Clerk explicitly says user should be admin (don't remove admin if set in Django)
            clerk_admin_status = clerk_user_data.get('public_metadata', {}).get('role') == 'admin'
            if clerk_admin_status and not user.is_admin:
                # Clerk says user should be admin, but Django doesn't have it - grant admin
                user.is_admin = True
                needs_save = True
            # If user is already admin in Django, keep it even if Clerk doesn't say so
            # This preserves manual admin assignments made in Django admin
            
            if needs_save:
                user.save()
        else:
            # Create new user
            user = cls.objects.create(
                clerk_id=clerk_id,
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                avatar_url=clerk_user_data.get('picture', ''),
                is_admin=clerk_user_data.get('public_metadata', {}).get('role') == 'admin',
            )
        
        return user


class UserPreferences(models.Model):
    """Store user preferences for UI customization."""
    
    THEME_CHOICES = [
        ('light', 'Light Mode'),
        ('dark', 'Dark Mode'),
        ('ocean', 'Ocean Blue'),
        ('metro', 'MetroShoe'),
        ('sunset', 'Sunset'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences',
        primary_key=True
    )
    # Store category order as JSON array, e.g. ["design", "productivity", "communication"]
    tools_category_order = models.JSONField(
        default=list,
        blank=True,
        help_text='Custom order of tool categories in My Tools page'
    )
    # Store custom category labels as JSON object, e.g. {"productivity": "Firstgroup", "other": "Misc"}
    # IMPORTANT: This only affects display labels, NOT the actual category values stored on tools.
    # Tools always keep their original category keys (e.g., "productivity", "other").
    # This field only maps category keys to custom display names for UI purposes.
    tools_category_labels = models.JSONField(
        default=dict,
        blank=True,
        help_text='Custom labels for tool categories. Maps category keys to custom display names. Does NOT modify tool.category values.'
    )
    # Store custom category colors as JSON object, e.g. {"productivity": "#3B82F6", "other": "#10B981"}
    # Maps category keys to hex color codes for visual distinction of groups
    tools_category_colors = models.JSONField(
        default=dict,
        blank=True,
        help_text='Custom colors for tool categories. Maps category keys to hex color codes (e.g., "#3B82F6").'
    )
    # Theme preference
    theme = models.CharField(
        max_length=20,
        choices=THEME_CHOICES,
        default='light',
        help_text='User selected color theme'
    )
    # Dashboard layout - stores widget positions and sizes as JSON
    # e.g. {"openTasks": {"x": 0, "y": 0, "width": 400, "height": 300}, "quote": {"x": 500, "y": 0, "width": 300, "height": 200}}
    dashboard_layout = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dashboard widget positions and sizes'
    )
    # Dashboard widget visibility - stores which widgets are visible
    # e.g. {"openTasks": true, "quote": true, "recentActivity": false}
    dashboard_widget_visibility = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dashboard widget visibility settings'
    )
    # Dashboard active widgets - stores which widgets are added to the dashboard
    # e.g. ["openTasks", "quote", "recentActivity"]
    dashboard_active_widgets = models.JSONField(
        default=list,
        blank=True,
        help_text='List of widget IDs that are active on the dashboard'
    )
    # Clock widget preferences
    clock_widget_timezones = models.JSONField(
        default=dict,
        blank=True,
        help_text='Clock widget timezone settings: {"timezone1": "...", "timezone2": "..."}'
    )
    # Mood widget preferences
    mood_widget_current = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text='Current mood emoji'
    )
    mood_widget_history = models.JSONField(
        default=list,
        blank=True,
        help_text='Mood history: [{"date": "YYYY-MM-DD", "mood": "😀"}, ...]'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_preferences'
        verbose_name = 'User Preference'
        verbose_name_plural = 'User Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email or self.user.username}"
