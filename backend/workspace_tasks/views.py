from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow admins to edit."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_admin


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks.
    Read access for all authenticated users.
    Write access for admins only.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by assignee
        assignee = self.request.query_params.get('assignee')
        if assignee:
            queryset = queryset.filter(assignee_id=assignee)
        
        # Search by title
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset
    
    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get('status', instance.status)
        
        # Set completed_at when task is marked as completed
        if new_status == 'completed' and instance.status != 'completed':
            serializer.save(completed_at=timezone.now())
        elif new_status != 'completed' and instance.status == 'completed':
            serializer.save(completed_at=None)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get task statistics."""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'todo': queryset.filter(status='todo').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'completed': queryset.filter(status='completed').count(),
        })
