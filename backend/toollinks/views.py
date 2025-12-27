from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ToolLink
from .serializers import ToolLinkSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_admin


class ToolLinkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tool links.
    Read access for all authenticated users.
    Write access for admins only.
    """
    queryset = ToolLink.objects.filter(is_active=True)
    serializer_class = ToolLinkSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Return list of available categories."""
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in ToolLink.CATEGORY_CHOICES
        ])
