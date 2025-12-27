# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspace_tasks', '0005_task_archived_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='archived_at',
            field=models.DateTimeField(blank=True, help_text='When the task was archived', null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='started_at',
            field=models.DateTimeField(blank=True, help_text='When the task was started (moved to in_progress)', null=True),
        ),
    ]

