from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import ToolLink, ToolFavorite
from .serializers import ToolLinkSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit shared tools.
    Users can create/edit/delete their own personal tools.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        # Allow admins to do anything
        if request.user.is_admin or request.user.is_superuser or request.user.is_staff:
            return True
        # Allow users to create personal tools
        if request.method == 'POST':
            return True
        return False
    
    def has_object_permission(self, request, view, obj):
        """Check if user can edit/delete a specific tool."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Allow read-only operations (GET, HEAD, OPTIONS) for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow toggle_favorite action for all authenticated users
        # Users should be able to star/favorite any tool they can view
        if view.action == 'toggle_favorite':
            return True
        
        # Ensure user is authenticated
        if not request.user or not request.user.is_authenticated:
            logger.warning(f"Unauthenticated user denied permission to edit tool {obj.id}")
            return False
        
        # Admins can edit/delete any tool
        if request.user.is_admin or request.user.is_superuser or request.user.is_staff:
            logger.info(f"Admin user {request.user.id} allowed to edit tool {obj.id}")
            return True
        
        # Get created_by_id - try multiple ways to ensure we get it
        created_by_id = None
        if hasattr(obj, 'created_by_id'):
            created_by_id = obj.created_by_id
        elif obj.created_by:
            created_by_id = obj.created_by.id if hasattr(obj.created_by, 'id') else None
        
        # Users can edit/delete their own tools (whether personal or not)
        # Check by created_by_id first (most reliable)
        if created_by_id and created_by_id == request.user.id:
            logger.info(f"User {request.user.id} allowed to edit their own tool {obj.id} (is_personal={obj.is_personal}, created_by_id={created_by_id})")
            return True
        
        # Also check by created_by object comparison (fallback)
        if obj.created_by:
            try:
                if obj.created_by.id == request.user.id:
                    logger.info(f"User {request.user.id} allowed to edit their own tool {obj.id} via object comparison (is_personal={obj.is_personal})")
                    return True
            except Exception as e:
                logger.warning(f"Error comparing created_by object: {e}")
        
        # Also check if it's a personal tool created by this user (double check)
        if obj.is_personal and created_by_id == request.user.id:
            logger.info(f"User {request.user.id} allowed to edit personal tool {obj.id}")
            return True
        
        logger.warning(f"User {request.user.id} denied permission to edit tool {obj.id} (created_by_id={created_by_id}, is_personal={getattr(obj, 'is_personal', None)}, request.user.id={request.user.id}, action={view.action})")
        return False


class ToolLinkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tool links.
    Read access for all authenticated users.
    Write access for admins only.
    """
    queryset = ToolLink.objects.all()
    serializer_class = ToolLinkSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def create(self, request, *args, **kwargs):
        """Override create to provide better error handling."""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating tool: {str(e)}", exc_info=True)
            # Return a proper error response
            error_detail = str(e)
            
            # Extract the actual error message from nested error details
            if hasattr(e, 'detail'):
                if isinstance(e.detail, dict):
                    # If detail is a dict, try to get the actual message
                    if 'detail' in e.detail:
                        error_detail = str(e.detail['detail'])
                    else:
                        error_detail = str(e.detail)
                else:
                    error_detail = str(e.detail)
            elif hasattr(e, 'message_dict'):
                error_detail = e.message_dict
            
            # Clean up the error message - remove nested error details
            if 'duplicate key' in error_detail.lower() or 'already exists' in error_detail.lower():
                error_detail = 'A tool with this ID already exists. Please try again.'
            elif 'Failed to create tool:' in error_detail:
                # Extract the actual error after "Failed to create tool:"
                parts = error_detail.split('Failed to create tool:', 1)
                if len(parts) > 1:
                    error_detail = parts[1].strip()
                    # Remove nested error detail wrappers
                    if error_detail.startswith("{'detail':"):
                        error_detail = error_detail.replace("{'detail':", "").replace("}", "").strip()
                        if error_detail.startswith("ErrorDetail(string='"):
                            error_detail = error_detail.replace("ErrorDetail(string='", "").replace("', code='invalid')", "").strip()
            
            return Response(
                {'detail': error_detail, 'message': 'An error occurred while creating the tool'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_queryset(self):
        # For list operations, only show active, non-personal tools (shared tools)
        # For detail operations (retrieve, update, delete), also include user's own personal tools
        user = self.request.user
        
        import logging
        logger = logging.getLogger(__name__)
        
        # Check if this is a detail operation (retrieve, update, partial_update, destroy)
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # Allow access to shared tools AND user's own personal tools
            # For update/delete operations, also include inactive tools if user created them
            # Use created_by_id for more reliable filtering
            if self.action in ['update', 'partial_update', 'destroy']:
                # For edit operations, include user's tools even if inactive
                queryset = ToolLink.objects.filter(
                    models.Q(is_personal=False, is_active=True) | 
                    models.Q(is_personal=True, created_by_id=user.id) |
                    models.Q(created_by_id=user.id)  # Include user's tools regardless of is_personal or is_active
                )
                logger.debug(f"Edit action '{self.action}': including all user's tools (user_id={user.id})")
            else:
                # For retrieve, only show active tools
                queryset = ToolLink.objects.filter(
                    is_active=True
                ).filter(
                    models.Q(is_personal=False) | models.Q(is_personal=True, created_by_id=user.id)
                )
                logger.debug(f"Retrieve action: including user's personal tools (user_id={user.id})")
        else:
            # For list operations, only show shared/public tools
            queryset = ToolLink.objects.filter(
                is_active=True,
                is_personal=False  # Only show shared/public tools, never personal tools
            )
            logger.debug(f"List action: filtering is_personal=False, is_active=True")
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    def get_serializer_context(self):
        """Add request context to serializer for is_favorite field."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set created_by and is_personal based on user permissions."""
        user = self.request.user
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Refresh user from DB to ensure we have latest admin status
            try:
                user.refresh_from_db()
            except:
                pass
            
            logger.info(f"perform_create: user_id={user.id}, is_admin={user.is_admin}, is_superuser={user.is_superuser}, is_staff={user.is_staff}")
            
            # If user is not admin, mark as personal tool
            if not (user.is_admin or user.is_superuser or user.is_staff):
                # Use save() with keyword arguments - this is the standard DRF pattern
                instance = serializer.save(created_by=user, is_personal=True)
                # Verify the tool was created with is_personal=True
                instance.refresh_from_db()
                logger.info(f"Created tool {instance.id}: name='{instance.name}', is_personal={instance.is_personal}, is_active={instance.is_active}, created_by_id={instance.created_by_id if instance.created_by else None}, user_id={user.id}, is_admin={user.is_admin}")
                
                # CRITICAL: Double-check and fix if wrong (signal should handle this, but be extra safe)
                if not instance.is_personal:
                    logger.error(f"CRITICAL ERROR: Tool {instance.id} was NOT created with is_personal=True! User: {user.id}, is_admin: {user.is_admin}. Fixing immediately...")
                    ToolLink.objects.filter(id=instance.id).update(is_personal=True)
                    instance.refresh_from_db()
                    logger.info(f"Fixed tool {instance.id} - is_personal is now {instance.is_personal}")
                
                if instance.created_by_id != user.id:
                    logger.error(f"ERROR: Tool {instance.id} created_by ({instance.created_by_id}) does not match user ({user.id})!")
            else:
                # Admins can create both shared and personal tools
                # The serializer will handle setting is_personal based on request data
                # Just set created_by
                instance = serializer.save(created_by=user)
                logger.info(f"Admin created tool {instance.id}: name='{instance.name}', is_personal={instance.is_personal}")
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': f'Failed to create tool: {str(e)}'})
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Return list of available categories."""
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in ToolLink.CATEGORY_CHOICES
        ])
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status for a tool."""
        tool = self.get_object()
        user = request.user
        
        try:
            favorite = ToolFavorite.objects.get(user=user, tool=tool)
            # If it already exists, remove it (unfavorite)
            favorite.delete()
            return Response({'is_favorite': False}, status=status.HTTP_200_OK)
        except ToolFavorite.DoesNotExist:
            # Get the highest order value for this user and add 1
            max_order = ToolFavorite.objects.filter(user=user).aggregate(
                max_order=models.Max('order')
            )['max_order'] or -1
            
            # Create new favorite with order
            favorite = ToolFavorite.objects.create(
                user=user,
                tool=tool,
                order=max_order + 1
            )
            return Response({'is_favorite': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get all tools favorited by the current user, plus user's personal tools, ordered by user preference."""
        user = request.user
        import logging
        logger = logging.getLogger(__name__)
        
        # Refresh user to get latest admin status
        try:
            user.refresh_from_db()
        except:
            pass
        
        # CRITICAL: Fix any tools that should be personal but aren't (for non-admin users)
        if not (user.is_admin or user.is_superuser or user.is_staff):
            # Find tools created by this user that should be personal but aren't
            incorrect_tools = ToolLink.objects.filter(
                created_by_id=user.id,
                is_personal=False
            )
            if incorrect_tools.exists():
                count = incorrect_tools.count()
                logger.warning(f"Found {count} tools for user {user.id} that should be personal. Fixing...")
                incorrect_tools.update(is_personal=True)
                logger.info(f"Fixed {count} tools for user {user.id}")
        
        # Get favorites ordered by user's order preference
        favorites_qs = ToolFavorite.objects.filter(
            user=user,
            tool__is_active=True
        ).select_related('tool').order_by('order', '-created_at')
        
        # Evaluate the queryset to get favorite tool IDs
        favorites_list = list(favorites_qs)
        favorite_tool_ids = [fav.tool_id for fav in favorites_list]
        
        # Get user's personal tools (not favorited yet)
        # Query with explicit conditions - use user.id for more reliable matching
        personal_tools = ToolLink.objects.filter(
            created_by_id=user.id,  # Use user.id instead of user object for more reliable matching
            is_personal=True,
            is_active=True
        ).exclude(
            id__in=favorite_tool_ids
        ).order_by('-created_at')
        
        # Log for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"User {user.id} ({user.email if hasattr(user, 'email') else 'no email'}) favorites query:")
        logger.info(f"  - Favorite tool IDs: {favorite_tool_ids}")
        logger.info(f"  - Personal tools found: {personal_tools.count()}")
        for tool in personal_tools:
            logger.info(f"    Tool {tool.id}: name='{tool.name}', is_personal={tool.is_personal}, is_active={tool.is_active}, created_by_id={tool.created_by_id if tool.created_by else None}")
        
        # Also check all personal tools for this user (for debugging)
        all_personal = ToolLink.objects.filter(created_by_id=user.id, is_personal=True)
        logger.info(f"  - All personal tools (including inactive): {all_personal.count()}")
        for tool in all_personal:
            logger.info(f"    Tool {tool.id}: name='{tool.name}', is_personal={tool.is_personal}, is_active={tool.is_active}, created_by_id={tool.created_by_id if tool.created_by else None}")
        
        # Apply category filter if provided
        category = request.query_params.get('category')
        if category:
            favorites_list = [fav for fav in favorites_list if fav.tool.category == category]
            personal_tools = personal_tools.filter(category=category)
        
        # Apply search filter if provided
        search = request.query_params.get('search')
        if search:
            favorites_list = [fav for fav in favorites_list if search.lower() in fav.tool.name.lower()]
            personal_tools = personal_tools.filter(name__icontains=search)
        
        # Extract tools from favorites
        favorite_tools = [fav.tool for fav in favorites_list]
        
        # Combine favorite tools and personal tools
        all_tools = list(favorite_tools) + list(personal_tools)
        
        # Sort by name for personal tools that aren't favorited
        # Favorite tools are already sorted by order
        serializer = self.get_serializer(all_tools, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def debug_my_tools(self, request):
        """Debug endpoint to see all tools for the current user."""
        user = request.user
        import logging
        logger = logging.getLogger(__name__)
        
        # Get all tools created by this user
        all_my_tools = ToolLink.objects.filter(created_by_id=user.id)
        
        # Get all personal tools
        personal_tools = ToolLink.objects.filter(created_by_id=user.id, is_personal=True)
        
        # Get all active personal tools
        active_personal = ToolLink.objects.filter(created_by_id=user.id, is_personal=True, is_active=True)
        
        debug_info = {
            'user_id': user.id,
            'user_email': getattr(user, 'email', 'no email'),
            'total_tools_created': all_my_tools.count(),
            'total_personal_tools': personal_tools.count(),
            'active_personal_tools': active_personal.count(),
            'tools': []
        }
        
        for tool in all_my_tools:
            debug_info['tools'].append({
                'id': tool.id,
                'name': tool.name,
                'is_personal': tool.is_personal,
                'is_active': tool.is_active,
                'created_by_id': tool.created_by_id,
                'created_at': tool.created_at.isoformat() if tool.created_at else None,
            })
        
        logger.info(f"Debug info for user {user.id}: {debug_info}")
        return Response(debug_info)
    
    @action(detail=False, methods=['post'])
    def fix_personal_tools(self, request):
        """Fix any tools that should be personal but aren't marked as such."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Find all tools created by non-admin users that have is_personal=False
        non_admin_users = User.objects.filter(
            is_admin=False,
            is_superuser=False,
            is_staff=False
        )
        
        incorrect_tools = ToolLink.objects.filter(
            created_by__in=non_admin_users,
            is_personal=False
        )
        
        count = incorrect_tools.count()
        incorrect_tools.update(is_personal=True)
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Fixed {count} tools that should have been personal")
        
        return Response({
            'message': f'Fixed {count} tools that should have been personal',
            'fixed_count': count
        })
    
    @action(detail=False, methods=['post'])
    def reorder_favorites(self, request):
        """Update the order of favorite tools for the current user."""
        user = request.user
        tool_orders = request.data.get('orders', [])  # Expected: [{'tool_id': 1, 'order': 0}, ...]
        
        if not isinstance(tool_orders, list):
            return Response(
                {'error': 'Invalid format. Expected a list of {tool_id, order} objects.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order for each tool
        updated_count = 0
        for item in tool_orders:
            tool_id = item.get('tool_id')
            new_order = item.get('order')
            
            if tool_id is None or new_order is None:
                continue
            
            try:
                favorite = ToolFavorite.objects.get(user=user, tool_id=tool_id)
                favorite.order = new_order
                favorite.save()
                updated_count += 1
            except ToolFavorite.DoesNotExist:
                continue
        
        return Response({
            'message': f'Updated order for {updated_count} tools',
            'updated_count': updated_count
        })
