# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_add_tools_category_colors'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreferences',
            name='dashboard_layout',
            field=models.JSONField(blank=True, default=dict, help_text='Dashboard widget positions and sizes'),
        ),
    ]

