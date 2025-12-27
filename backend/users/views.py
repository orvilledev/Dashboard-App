from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from .models import User, UserPreferences
from .serializers import UserSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's profile."""
        # Refresh user from database to ensure we have the latest data (especially is_admin)
        request.user.refresh_from_db()
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Update the current user's profile."""
        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request):
        """Upload a profile picture file."""
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'No file provided. Please upload an image file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response(
                {'error': f'Invalid file type. Allowed types: {", ".join(allowed_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if avatar_file.size > max_size:
            return Response(
                {'error': 'File size too large. Maximum size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate unique filename
            file_extension = os.path.splitext(avatar_file.name)[1] or '.jpg'
            filename = f'avatars/user_{request.user.id}_{avatar_file.name}'
            
            # Save file
            saved_path = default_storage.save(filename, ContentFile(avatar_file.read()))
            
            # Get the URL - always return absolute URL
            base_url = request.build_absolute_uri('/')[:-1]
            # Remove leading slash from saved_path if present
            media_path = saved_path.lstrip('/') if saved_path.startswith('/') else saved_path
            avatar_url = f"{base_url}/media/{media_path}"
            
            # Update user's avatar_url
            request.user.avatar_url = avatar_url
            request.user.save()
            
            serializer = self.get_serializer(request.user)
            return Response({
                'message': 'Avatar uploaded successfully',
                'avatar_url': avatar_url,
                'user': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to upload avatar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users by email or name."""
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'results': [], 'message': 'Please enter at least 2 characters'})
        
        users = User.objects.filter(
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(username__icontains=query)
        ).exclude(id=request.user.id)[:10]  # Limit to 10 results, exclude current user
        
        serializer = self.get_serializer(users, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'])
    def preferences(self, request):
        """Get the current user's preferences."""
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
        )
        return Response({
            'tools_category_order': preferences.tools_category_order,
            'tools_category_labels': preferences.tools_category_labels,
            'tools_category_colors': preferences.tools_category_colors,
            'theme': preferences.theme,
            'dashboard_layout': preferences.dashboard_layout,
            'dashboard_widget_visibility': preferences.dashboard_widget_visibility,
            'dashboard_active_widgets': preferences.dashboard_active_widgets,
            'clock_widget_timezones': preferences.clock_widget_timezones,
            'mood_widget_current': preferences.mood_widget_current,
            'mood_widget_history': preferences.mood_widget_history
        })
    
    @action(detail=False, methods=['post'])
    def update_preferences(self, request):
        """Update the current user's preferences."""
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
        )
        
        updated = False
        
        # Update category order if provided
        if 'tools_category_order' in request.data:
            category_order = request.data['tools_category_order']
            if isinstance(category_order, list):
                preferences.tools_category_order = category_order
                updated = True
            else:
                return Response(
                    {'error': 'tools_category_order must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update category labels if provided
        # IMPORTANT: This only updates display labels in user preferences.
        # It does NOT modify the category field on ToolLink models.
        # Tools retain their original category values (e.g., "productivity", "other").
        # This is purely a display preference that maps category keys to custom labels.
        if 'tools_category_labels' in request.data:
            category_labels = request.data['tools_category_labels']
            if isinstance(category_labels, dict):
                preferences.tools_category_labels = category_labels
                updated = True
            else:
                return Response(
                    {'error': 'tools_category_labels must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update category colors if provided
        if 'tools_category_colors' in request.data:
            category_colors = request.data['tools_category_colors']
            if isinstance(category_colors, dict):
                # Validate that values are valid hex colors
                import re
                hex_color_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
                for key, value in category_colors.items():
                    if value and not hex_color_pattern.match(str(value)):
                        return Response(
                            {'error': f'Invalid color format for category {key}. Must be a hex color (e.g., "#3B82F6")'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                preferences.tools_category_colors = category_colors
                updated = True
            else:
                return Response(
                    {'error': 'tools_category_colors must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update theme if provided
        if 'theme' in request.data:
            theme = request.data['theme']
            valid_themes = ['light', 'dark', 'ocean', 'metro', 'sunset']
            if theme in valid_themes:
                preferences.theme = theme
                updated = True
            else:
                return Response(
                    {'error': f'Invalid theme. Must be one of: {", ".join(valid_themes)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update dashboard layout if provided
        if 'dashboard_layout' in request.data:
            dashboard_layout = request.data['dashboard_layout']
            if isinstance(dashboard_layout, dict):
                preferences.dashboard_layout = dashboard_layout
                updated = True
            else:
                return Response(
                    {'error': 'dashboard_layout must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update dashboard widget visibility if provided
        if 'dashboard_widget_visibility' in request.data:
            widget_visibility = request.data['dashboard_widget_visibility']
            if isinstance(widget_visibility, dict):
                preferences.dashboard_widget_visibility = widget_visibility
                updated = True
            else:
                return Response(
                    {'error': 'dashboard_widget_visibility must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update dashboard active widgets if provided
        if 'dashboard_active_widgets' in request.data:
            active_widgets = request.data['dashboard_active_widgets']
            if isinstance(active_widgets, list):
                preferences.dashboard_active_widgets = active_widgets
                updated = True
            else:
                return Response(
                    {'error': 'dashboard_active_widgets must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update clock widget timezones if provided
        if 'clock_widget_timezones' in request.data:
            clock_timezones = request.data['clock_widget_timezones']
            if isinstance(clock_timezones, dict):
                preferences.clock_widget_timezones = clock_timezones
                updated = True
            else:
                return Response(
                    {'error': 'clock_widget_timezones must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update mood widget preferences if provided
        if 'mood_widget_current' in request.data:
            preferences.mood_widget_current = request.data['mood_widget_current']
            updated = True
        
        if 'mood_widget_history' in request.data:
            mood_history = request.data['mood_widget_history']
            if isinstance(mood_history, list):
                preferences.mood_widget_history = mood_history
                updated = True
            else:
                return Response(
                    {'error': 'mood_widget_history must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if updated:
            preferences.save()
            return Response({
                'message': 'Preferences updated successfully',
                'tools_category_order': preferences.tools_category_order,
                'tools_category_labels': preferences.tools_category_labels,
                'tools_category_colors': preferences.tools_category_colors,
                'theme': preferences.theme,
                'dashboard_layout': preferences.dashboard_layout,
                'dashboard_widget_visibility': preferences.dashboard_widget_visibility,
                'dashboard_active_widgets': preferences.dashboard_active_widgets,
                'clock_widget_timezones': preferences.clock_widget_timezones,
                'mood_widget_current': preferences.mood_widget_current,
                'mood_widget_history': preferences.mood_widget_history
            })
        
        return Response(
            {'error': 'No preferences provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
