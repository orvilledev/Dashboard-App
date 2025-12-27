from django.contrib.auth.models import AbstractUser
from django.db import models


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
    
    @classmethod
    def get_or_create_from_clerk(cls, clerk_user_data: dict) -> 'User':
        """
        Get or create a user from Clerk JWT claims.
        """
        clerk_id = clerk_user_data.get('sub')
        email = clerk_user_data.get('email', '')
        
        user, created = cls.objects.get_or_create(
            clerk_id=clerk_id,
            defaults={
                'username': clerk_id,
                'email': email,
                'first_name': clerk_user_data.get('given_name', ''),
                'last_name': clerk_user_data.get('family_name', ''),
                'avatar_url': clerk_user_data.get('picture', ''),
                'is_admin': clerk_user_data.get('public_metadata', {}).get('role') == 'admin',
            }
        )
        
        if not created:
            # Update user info on each login
            user.email = email
            user.first_name = clerk_user_data.get('given_name', user.first_name)
            user.last_name = clerk_user_data.get('family_name', user.last_name)
            user.avatar_url = clerk_user_data.get('picture', user.avatar_url)
            user.is_admin = clerk_user_data.get('public_metadata', {}).get('role') == 'admin'
            user.save()
        
        return user
