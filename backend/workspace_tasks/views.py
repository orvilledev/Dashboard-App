from django.utils import timezone
from django.db import DatabaseError
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskTemplate, TaskTemplateSubtask
from .serializers import TaskSerializer, TaskTemplateSerializer, TaskTemplateCreateSerializer


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
        
        # For detail actions (retrieve, update, partial_update, destroy) and custom actions,
        # don't filter by parent_task to allow access to subtasks
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'update_status']:
            # Don't filter by parent_task for these actions
            pass
        else:
            # For list actions, filter by parent_task
            parent_task = self.request.query_params.get('parent_task')
            if parent_task is not None:
                if parent_task == '':
                    queryset = queryset.filter(parent_task__isnull=True)
                else:
                    queryset = queryset.filter(parent_task_id=parent_task)
            else:
                # Default: only top-level tasks
                queryset = queryset.filter(parent_task__isnull=True)
        
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
        
        # Prefetch subtasks for performance
        queryset = queryset.prefetch_related('subtasks')
        
        return queryset
    
    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get('status', instance.status)
        old_status = instance.status
        
        # Set started_at when task moves to in_progress
        if new_status == 'in_progress' and old_status != 'in_progress' and not instance.started_at:
            serializer.save(started_at=timezone.now())
        # Set completed_at when task is marked as completed
        elif new_status == 'completed' and old_status != 'completed':
            serializer.save(completed_at=timezone.now())
        elif new_status != 'completed' and old_status == 'completed':
            serializer.save(completed_at=None)
        # Set archived_at when task is archived
        elif new_status == 'archived' and old_status != 'archived':
            serializer.save(archived_at=timezone.now())
        elif new_status != 'archived' and old_status == 'archived':
            serializer.save(archived_at=None)
        else:
            serializer.save()
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Allow any authenticated user to update task status."""
        task = self.get_object()
        new_status = request.data.get('status')
        old_status = task.status
        
        if new_status not in ['todo', 'in_progress', 'completed', 'archived']:
            return Response(
                {'error': 'Invalid status. Must be one of: todo, in_progress, completed, archived'},
                status=400
            )
        
        # Update status
        task.status = new_status
        
        # Set started_at when task moves to in_progress
        if new_status == 'in_progress' and old_status != 'in_progress' and not task.started_at:
            task.started_at = timezone.now()
        
        # Set completed_at when task is marked as completed
        if new_status == 'completed' and old_status != 'completed':
            task.completed_at = timezone.now()
        elif new_status != 'completed' and old_status == 'completed':
            task.completed_at = None
        
        # Set archived_at when task is archived
        if new_status == 'archived' and old_status != 'archived':
            task.archived_at = timezone.now()
        elif new_status != 'archived' and old_status == 'archived':
            task.archived_at = None
        
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get task statistics."""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'todo': queryset.filter(status='todo').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'completed': queryset.filter(status='completed').count(),
            'archived': queryset.filter(status='archived').count(),
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_as_template(self, request, pk=None):
        """Save a task as a template."""
        task = self.get_object()
        
        # Prevent saving archived tasks as templates
        if task.status == 'archived':
            return Response(
                {'error': 'Cannot save archived tasks as templates.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        template_name = request.data.get('name', task.title)
        
        # Create template
        template = TaskTemplate.objects.create(
            name=template_name,
            title=task.title,
            description=task.description,
            link=task.link,
            priority=task.priority,
            created_by=request.user
        )
        
        # Create subtasks
        subtasks = task.subtasks.all()
        for index, subtask in enumerate(subtasks):
            TaskTemplateSubtask.objects.create(
                template=template,
                title=subtask.title,
                description=subtask.description,
                order=index
            )
        
        serializer = TaskTemplateSerializer(template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing task templates.
    """
    queryset = TaskTemplate.objects.all()
    serializer_class = TaskTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own templates
        return TaskTemplate.objects.filter(created_by=self.request.user).prefetch_related('subtasks')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def create_task_from_template(self, request, pk=None):
        """Create a new task from a template."""
        template = self.get_object()
        
        # Create the task
        task = Task.objects.create(
            title=template.title,
            description=template.description,
            link=template.link,
            priority=template.priority,
            status='todo',
            created_by=request.user
        )
        
        # Create subtasks
        for subtask_template in template.subtasks.all():
            Task.objects.create(
                title=subtask_template.title,
                description=subtask_template.description,
                parent_task=task,
                status='todo',
                priority=task.priority,
                created_by=request.user
            )
        
        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
