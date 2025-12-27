from django.apps import AppConfig


class ToollinksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'toollinks'
    
    def ready(self):
        """Connect signals when the app is ready."""
        import toollinks.signals  # noqa