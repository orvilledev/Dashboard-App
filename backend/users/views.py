from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
import os
from .models import User, UserPreferences, LeaveSchedule
from .serializers import UserSerializer, LeaveScheduleSerializer


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
            'custom_theme_colors': preferences.custom_theme_colors,
            'custom_themes': preferences.custom_themes,
            'dashboard_layout': preferences.dashboard_layout,
            'dashboard_widget_visibility': preferences.dashboard_widget_visibility,
            'dashboard_active_widgets': preferences.dashboard_active_widgets,
            'clock_widget_timezones': preferences.clock_widget_timezones,
            'mood_widget_current': preferences.mood_widget_current,
            'mood_widget_history': preferences.mood_widget_history,
            'custom_widgets': preferences.custom_widgets,
            'alarm_widget_alarms': preferences.alarm_widget_alarms,
            'quick_access_links': preferences.quick_access_links,
            'task_layout': preferences.task_layout
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
            # Theme can be 'light', 'dark', 'metro', or 'custom:{theme_id}'
            if theme in ['light', 'dark', 'metro']:
                preferences.theme = theme
                updated = True
            elif theme.startswith('custom:'):
                # Validate that the custom theme exists
                theme_id = theme.replace('custom:', '')
                # Initialize custom_themes if it doesn't exist
                if not preferences.custom_themes:
                    preferences.custom_themes = {}
                if theme_id in preferences.custom_themes:
                    preferences.theme = theme
                    updated = True
                else:
                    # Allow setting theme even if not saved yet (for preview purposes)
                    # The theme will be saved when the user saves the custom theme
                    preferences.theme = theme
                    updated = True
            else:
                return Response(
                    {'error': 'Invalid theme format. Must be "light", "dark", "metro", or "custom:{theme_id}"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Save a new custom theme or update existing one
        if 'save_custom_theme' in request.data:
            theme_data = request.data['save_custom_theme']
            if not isinstance(theme_data, dict):
                return Response(
                    {'error': 'save_custom_theme must be a dictionary with "id", "name", and "colors"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            theme_id = theme_data.get('id')
            theme_name = theme_data.get('name', '').strip()
            theme_colors = theme_data.get('colors')
            
            if not theme_id:
                return Response(
                    {'error': 'Theme ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not theme_name:
                return Response(
                    {'error': 'Theme name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(theme_colors, dict):
                return Response(
                    {'error': 'Theme colors must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate colors
            import re
            hex_color_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
            required_keys = ['background', 'surface', 'surfaceElevated', 'textPrimary', 
                           'textSecondary', 'textTertiary', 'primary', 'primaryHover', 
                           'primaryLight', 'border', 'borderLight', 'success', 
                           'warning', 'error', 'info']
            
            for key in required_keys:
                if key not in theme_colors:
                    return Response(
                        {'error': f'Missing required color key: {key}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if theme_colors[key] and not hex_color_pattern.match(str(theme_colors[key])):
                    return Response(
                        {'error': f'Invalid color format for {key}. Must be a hex color (e.g., "#3B82F6")'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Initialize custom_themes if it doesn't exist
            if not preferences.custom_themes:
                preferences.custom_themes = {}
            
            # Save the theme
            preferences.custom_themes[theme_id] = {
                'name': theme_name,
                'colors': theme_colors,
                'created_at': preferences.custom_themes.get(theme_id, {}).get('created_at', None) or str(timezone.now().isoformat()),
                'updated_at': str(timezone.now().isoformat())
            }
            updated = True
        
        # Delete a custom theme
        if 'delete_custom_theme' in request.data:
            theme_id = request.data['delete_custom_theme']
            if not isinstance(theme_id, str):
                return Response(
                    {'error': 'delete_custom_theme must be a theme ID string'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not preferences.custom_themes:
                preferences.custom_themes = {}
            
            if theme_id in preferences.custom_themes:
                del preferences.custom_themes[theme_id]
                # If the deleted theme was active, switch to light theme
                if preferences.theme == f'custom:{theme_id}':
                    preferences.theme = 'light'
                updated = True
            else:
                return Response(
                    {'error': f'Theme with ID "{theme_id}" not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Legacy: Update custom theme colors if provided (for backward compatibility)
        if 'custom_theme_colors' in request.data:
            custom_colors = request.data['custom_theme_colors']
            if isinstance(custom_colors, dict):
                # Validate that values are valid hex colors
                import re
                hex_color_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
                required_keys = ['background', 'surface', 'surfaceElevated', 'textPrimary', 
                               'textSecondary', 'textTertiary', 'primary', 'primaryHover', 
                               'primaryLight', 'border', 'borderLight', 'success', 
                               'warning', 'error', 'info']
                
                # Check if all required keys are present
                for key in required_keys:
                    if key not in custom_colors:
                        return Response(
                            {'error': f'Missing required color key: {key}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if custom_colors[key] and not hex_color_pattern.match(str(custom_colors[key])):
                        return Response(
                            {'error': f'Invalid color format for {key}. Must be a hex color (e.g., "#3B82F6")'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                preferences.custom_theme_colors = custom_colors
                updated = True
            else:
                return Response(
                    {'error': 'custom_theme_colors must be a dictionary'},
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
        
        # Update custom widgets if provided
        if 'custom_widgets' in request.data:
            custom_widgets = request.data['custom_widgets']
            if isinstance(custom_widgets, dict):
                preferences.custom_widgets = custom_widgets
                updated = True
            else:
                return Response(
                    {'error': 'custom_widgets must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update alarm widget alarms if provided
        if 'alarm_widget_alarms' in request.data:
            alarm_alarms = request.data['alarm_widget_alarms']
            if isinstance(alarm_alarms, list):
                preferences.alarm_widget_alarms = alarm_alarms
                updated = True
            else:
                return Response(
                    {'error': 'alarm_widget_alarms must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update quick access links if provided
        if 'quick_access_links' in request.data:
            quick_links = request.data['quick_access_links']
            if isinstance(quick_links, list):
                # Validate each link has required fields
                for link in quick_links:
                    if not isinstance(link, dict):
                        return Response(
                            {'error': 'Each quick access link must be an object'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if 'id' not in link or 'label' not in link or 'url' not in link:
                        return Response(
                            {'error': 'Each quick access link must have id, label, and url fields'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                preferences.quick_access_links = quick_links
                updated = True
            else:
                return Response(
                    {'error': 'quick_access_links must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update task layout if provided
        if 'task_layout' in request.data:
            task_layout = request.data['task_layout']
            if isinstance(task_layout, dict):
                preferences.task_layout = task_layout
                updated = True
            else:
                return Response(
                    {'error': 'task_layout must be a dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if updated:
            # Use raw SQL to update theme field to bypass Django's choices validation
            # This is necessary until migration 0015 is applied
            from django.db import connection
            import json
            
            try:
                # Save all fields normally first
                preferences.save()
            except Exception as e:
                # If we get a ProgrammingError due to choices constraint, use raw SQL
                if 'ProgrammingError' in str(type(e).__name__) or 'invalid input value for enum' in str(e).lower():
                    with connection.cursor() as cursor:
                        # Build update query for all fields
                        updates = []
                        params = []
                        
                        # Update theme using raw SQL (bypasses choices validation)
                        if hasattr(preferences, 'theme') and preferences.theme:
                            updates.append("theme = %s")
                            params.append(preferences.theme)
                        
                        # Update custom_themes
                        if hasattr(preferences, 'custom_themes'):
                            updates.append("custom_themes = %s")
                            params.append(json.dumps(preferences.custom_themes))
                        
                        # Update other fields that might have changed
                        for field_name in ['tools_category_order', 'tools_category_labels', 
                                         'tools_category_colors', 'custom_theme_colors',
                                         'dashboard_layout', 'dashboard_widget_visibility',
                                         'dashboard_active_widgets', 'clock_widget_timezones',
                                         'mood_widget_current', 'mood_widget_history',
                                         'custom_widgets', 'alarm_widget_alarms',
                                         'quick_access_links', 'task_layout']:
                            if hasattr(preferences, field_name):
                                value = getattr(preferences, field_name)
                                if value is not None:
                                    updates.append(f"{field_name} = %s")
                                    params.append(json.dumps(value) if isinstance(value, (dict, list)) else value)
                        
                        if updates:
                            params.append(preferences.user_id)
                            cursor.execute(
                                f"UPDATE users_userpreferences SET {', '.join(updates)} WHERE user_id = %s",
                                params
                            )
                    
                    preferences.refresh_from_db()
                else:
                    raise
            
            return Response({
                'message': 'Preferences updated successfully',
                'tools_category_order': preferences.tools_category_order,
                'tools_category_labels': preferences.tools_category_labels,
                'tools_category_colors': preferences.tools_category_colors,
                'theme': preferences.theme,
                'custom_theme_colors': preferences.custom_theme_colors,
                'custom_themes': preferences.custom_themes,
                'dashboard_layout': preferences.dashboard_layout,
                'dashboard_widget_visibility': preferences.dashboard_widget_visibility,
                'dashboard_active_widgets': preferences.dashboard_active_widgets,
                'clock_widget_timezones': preferences.clock_widget_timezones,
                'mood_widget_current': preferences.mood_widget_current,
                'mood_widget_history': preferences.mood_widget_history,
                'alarm_widget_alarms': preferences.alarm_widget_alarms,
                'quick_access_links': preferences.quick_access_links,
                'task_layout': preferences.task_layout
            })
        
        return Response(
            {'error': 'No preferences provided'},
            status=status.HTTP_400_BAD_REQUEST
        )


class LeaveScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leave schedules.
    Users can only manage their own leaves.
    """
    serializer_class = LeaveScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's leave schedules."""
        return LeaveSchedule.objects.filter(user=self.request.user).order_by('-start_date')
    
    def perform_create(self, serializer):
        """Set the user to the current user when creating a leave schedule."""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Update leave schedule - ensure user can only update their own."""
        serializer.save()

