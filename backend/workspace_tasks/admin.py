from django.contrib import admin
from .models import Task, TaskTemplate, TaskTemplateSubtask


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'assignee', 'due_date', 'created_by', 'created_at')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'title', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'title', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TaskTemplateSubtask)
class TaskTemplateSubtaskAdmin(admin.ModelAdmin):
    list_display = ('template', 'title', 'order')
    list_filter = ('template',)
    search_fields = ('title', 'description')
    ordering = ('template', 'order', 'id')
