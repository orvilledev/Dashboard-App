# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_userpreferences_dashboard_active_widgets'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreferences',
            name='clock_widget_timezones',
            field=models.JSONField(blank=True, default=dict, help_text='Clock widget timezone settings: {"timezone1": "...", "timezone2": "..."}'),
        ),
        migrations.AddField(
            model_name='userpreferences',
            name='mood_widget_current',
            field=models.CharField(blank=True, help_text='Current mood emoji', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='userpreferences',
            name='mood_widget_history',
            field=models.JSONField(blank=True, default=list, help_text='Mood history: [{"date": "YYYY-MM-DD", "mood": "😀"}, ...]'),
        ),
    ]

