from rest_framework import serializers
from .models import Task, TaskTemplate, TaskTemplateSubtask


class SubtaskSerializer(serializers.ModelSerializer):
    """Serializer for subtasks (simplified, no nested subtasks)"""
    created_by_name = serializers.SerializerMethodField()
    assignee_name = serializers.SerializerMethodField()
    started_at = serializers.SerializerMethodField()
    archived_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'link', 'status', 'priority',
            'due_date', 'created_by', 'created_by_name',
            'assignee', 'assignee_name', 'parent_task',
            'created_at', 'updated_at', 'started_at', 'completed_at', 'archived_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'completed_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_assignee_name(self, obj):
        if obj.assignee:
            return f"{obj.assignee.first_name} {obj.assignee.last_name}".strip() or obj.assignee.username
        return None
    
    def get_started_at(self, obj):
        # Safely get started_at, handling case where field might not exist in DB yet
        if hasattr(obj, 'started_at'):
            return obj.started_at
        return None
    
    def get_archived_at(self, obj):
        # Safely get archived_at, handling case where field might not exist in DB yet
        if hasattr(obj, 'archived_at'):
            return obj.archived_at
        return None


class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    assignee_name = serializers.SerializerMethodField()
    subtasks = SubtaskSerializer(many=True, read_only=True)
    started_at = serializers.SerializerMethodField()
    archived_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'link', 'status', 'priority',
            'due_date', 'created_by', 'created_by_name',
            'assignee', 'assignee_name', 'parent_task',
            'subtasks', 'created_at', 'updated_at', 'started_at', 'completed_at', 'archived_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'completed_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_assignee_name(self, obj):
        if obj.assignee:
            return f"{obj.assignee.first_name} {obj.assignee.last_name}".strip() or obj.assignee.username
        return None
    
    def get_started_at(self, obj):
        # Safely get started_at, handling case where field might not exist in DB yet
        if hasattr(obj, 'started_at'):
            return obj.started_at
        return None
    
    def get_archived_at(self, obj):
        # Safely get archived_at, handling case where field might not exist in DB yet
        if hasattr(obj, 'archived_at'):
            return obj.archived_at
        return None
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskTemplateSubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskTemplateSubtask
        fields = ['id', 'title', 'description', 'order']
        read_only_fields = ['id']


class TaskTemplateSerializer(serializers.ModelSerializer):
    subtasks = TaskTemplateSubtaskSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskTemplate
        fields = ['id', 'name', 'title', 'description', 'link', 'priority', 'subtasks', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class TaskTemplateCreateSerializer(serializers.Serializer):
    """Serializer for creating a task template from an existing task."""
    name = serializers.CharField(max_length=255)
    task_id = serializers.IntegerField()
