# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspace_tasks', '0004_tasktemplate_tasktemplatesubtask'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='status',
            field=models.CharField(choices=[('todo', 'To Do'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('archived', 'Archived')], default='todo', max_length=20),
        ),
    ]

