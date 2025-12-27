# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_userpreferences_dashboard_widget_visibility'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreferences',
            name='dashboard_active_widgets',
            field=models.JSONField(blank=True, default=list, help_text='List of widget IDs that are active on the dashboard'),
        ),
    ]

