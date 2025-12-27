from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'clerk_id', 'email', 'username',
            'first_name', 'last_name', 'full_name',
            'avatar_url', 'is_admin', 'date_joined'
        ]
        read_only_fields = ['id', 'clerk_id', 'date_joined']
    
    def get_full_name(self, obj):
        # Return full name if available, otherwise use email (never use username/Clerk ID)
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name
        # Fallback to email instead of username (username is often a Clerk ID)
        return obj.email or obj.username
    
    def get_is_admin(self, obj):
        """Superusers and staff automatically have admin status in the dashboard."""
        return obj.is_admin or obj.is_superuser or obj.is_staff

