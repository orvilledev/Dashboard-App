from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import ToolLink
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=ToolLink)
def force_personal_tools_before_save(sender, instance, **kwargs):
    """
    PRE-SAVE signal to force is_personal=True BEFORE saving to database.
    This prevents the wrong value from ever being written.
    """
    if instance.created_by:
        # Refresh to get latest user data
        try:
            instance.created_by.refresh_from_db()
        except:
            pass
        
        # If user is not admin, force is_personal=True BEFORE save
        if not (instance.created_by.is_admin or instance.created_by.is_superuser or instance.created_by.is_staff):
            if not instance.is_personal:
                logger.warning(f"PRE-SAVE Signal: Tool {instance.id or 'NEW'} has is_personal=False for non-admin user {instance.created_by_id}. Forcing is_personal=True before save.")
                instance.is_personal = True


@receiver(post_save, sender=ToolLink)
def ensure_personal_tools_after_save(sender, instance, created, **kwargs):
    """
    POST-SAVE signal to ensure non-admin users' tools are always marked as personal.
    This runs AFTER the model is saved as a final safeguard.
    """
    if instance.created_by:
        # Refresh to get latest user data
        try:
            instance.created_by.refresh_from_db()
        except:
            pass
        
        # If user is not admin and tool is not personal, fix it
        if not (instance.created_by.is_admin or instance.created_by.is_superuser or instance.created_by.is_staff):
            if not instance.is_personal:
                logger.warning(f"POST-SAVE Signal: Tool {instance.id} has is_personal=False for non-admin user {instance.created_by_id}. Fixing...")
                # Update directly in database to avoid recursion
                ToolLink.objects.filter(id=instance.id).update(is_personal=True)
                # Refresh the instance
                instance.refresh_from_db()
                logger.info(f"POST-SAVE Signal: Fixed tool {instance.id} - is_personal is now {instance.is_personal}")

