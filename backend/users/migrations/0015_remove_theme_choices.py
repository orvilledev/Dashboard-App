# Generated manually to remove choices constraint from theme field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_add_task_layout'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userpreferences',
            name='theme',
            field=models.CharField(
                default='light',
                help_text='User selected color theme. For custom themes, format is "custom:{theme_id}"',
                max_length=50
            ),
        ),
    ]

