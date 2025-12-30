"""
Shared permission classes for the application.
"""
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit shared resources.
    Regular users can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin or request.user.is_superuser or request.user.is_staff


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission that allows admins to do anything,
    but regular users can only access their own resources.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.is_admin or request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'created_by'):
            return obj.created_by_id == request.user.id
        if hasattr(obj, 'user'):
            return obj.user_id == request.user.id
        
        return False


class IsAuthenticatedOrReadOnlyInDebug(permissions.BasePermission):
    """
    Allow read access without authentication in DEBUG mode.
    Require authentication for write operations always.
    """
    def has_permission(self, request, view):
        from django.conf import settings
        
        if request.method in permissions.SAFE_METHODS:
            # Allow read access in DEBUG mode without auth
            if settings.DEBUG:
                return True
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated

