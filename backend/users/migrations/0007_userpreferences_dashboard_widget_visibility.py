# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_userpreferences_dashboard_layout'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreferences',
            name='dashboard_widget_visibility',
            field=models.JSONField(blank=True, default=dict, help_text='Dashboard widget visibility settings'),
        ),
    ]

