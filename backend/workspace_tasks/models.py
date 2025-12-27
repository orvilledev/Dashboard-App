from django.db import models
from django.conf import settings


class Task(models.Model):
    """Model for task management."""
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    link = models.URLField(max_length=500, blank=True, null=True, help_text='Optional link related to the task')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    
    parent_task = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subtasks',
        help_text='Parent task if this is a subtask'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True, help_text='When the task was started (moved to in_progress)')
    completed_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True, help_text='When the task was archived')
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
    
    def __str__(self):
        return self.title


class TaskTemplate(models.Model):
    """Model for storing task templates that can be reused."""
    
    name = models.CharField(max_length=255, help_text='Template name')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    link = models.URLField(max_length=500, blank=True, null=True)
    priority = models.CharField(max_length=20, choices=Task.PRIORITY_CHOICES, default='medium')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_task_templates'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_templates'
        ordering = ['-created_at']
        verbose_name = 'Task Template'
        verbose_name_plural = 'Task Templates'
    
    def __str__(self):
        return self.name


class TaskTemplateSubtask(models.Model):
    """Model for storing subtasks in a task template."""
    
    template = models.ForeignKey(
        TaskTemplate,
        on_delete=models.CASCADE,
        related_name='subtasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0, help_text='Order of subtask in the template')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_template_subtasks'
        ordering = ['order', 'id']
        verbose_name = 'Task Template Subtask'
        verbose_name_plural = 'Task Template Subtasks'
    
    def __str__(self):
        return f"{self.template.name} - {self.title}"
