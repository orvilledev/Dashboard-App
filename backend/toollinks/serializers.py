from rest_framework import serializers
from .models import ToolLink, ToolFavorite


class ToolLinkSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = ToolLink
        fields = [
            'id', 'name', 'url', 'description', 'category',
            'icon_url', 'is_active', 'is_personal', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_favorite'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_favorite']
        # Note: is_personal is NOT in read_only_fields because we need to set it in create()
        # But it should never come from the request - it's always set by the backend
        extra_kwargs = {
            'is_active': {'default': True},
        }
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_is_favorite(self, obj):
        """Check if the current user has favorited this tool."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return ToolFavorite.objects.filter(user=request.user, tool=obj).exists()
        return False
    
    def validate(self, data):
        """Validate that non-admin users cannot create shared tools."""
        user = self.context['request'].user
        # If this is a create operation and user is not admin, force is_personal=True
        # This prevents non-admin users from creating shared tools even if they try to set is_personal=False
        if self.instance is None:  # This is a create operation
            if not (user.is_admin or user.is_superuser or user.is_staff):
                # Remove is_personal from request data for non-admins - we'll set it ourselves in create()
                data.pop('is_personal', None)
                # Force is_personal=True for non-admin users
                data['is_personal'] = True
            # For admins, keep is_personal if provided in the request
            # This allows admins to explicitly create personal tools by passing is_personal=True
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Ensure is_active is set if not provided
            if 'is_active' not in validated_data:
                validated_data['is_active'] = True
            
            # CRITICAL: Always set created_by and is_personal explicitly for non-admin users
            # This ensures they are set even if something goes wrong with the save() kwargs
            if not (user.is_admin or user.is_superuser or user.is_staff):
                # Force is_personal=True for non-admin users - this is the source of truth
                validated_data['is_personal'] = True
                validated_data['created_by'] = user
                logger.info(f"FORCING is_personal=True for non-admin user {user.id}")
            else:
                # For admins, use what's provided or default to False
                if 'created_by' not in validated_data:
                    validated_data['created_by'] = user
                if 'is_personal' not in validated_data:
                    validated_data['is_personal'] = False
            
            # Log what we're creating for debugging
            logger.info(f"Serializer.create() called: is_personal={validated_data.get('is_personal')}, created_by={validated_data.get('created_by')}")
            
            # Create the instance
            instance = super().create(validated_data)
            
            # CRITICAL: Verify after creation and fix if wrong
            instance.refresh_from_db()
            logger.info(f"Tool {instance.id} created in DB: is_personal={instance.is_personal}, created_by_id={instance.created_by_id}, user_id={user.id}")
            
            # If the tool was created incorrectly, fix it immediately
            if not (user.is_admin or user.is_superuser or user.is_staff):
                if not instance.is_personal or instance.created_by_id != user.id:
                    logger.error(f"ERROR: Tool {instance.id} was created incorrectly! Fixing...")
                    instance.is_personal = True
                    instance.created_by = user
                    instance.save(update_fields=['is_personal', 'created_by'])
                    instance.refresh_from_db()
                    logger.info(f"Fixed tool {instance.id}: is_personal={instance.is_personal}, created_by_id={instance.created_by_id}")
            
            return instance
        except Exception as e:
            logger.error(f"Error in serializer.create(): {str(e)}", exc_info=True)
            # Re-raise as ValidationError so it's properly handled
            from rest_framework.exceptions import ValidationError
            error_msg = str(e)
            if 'url' in error_msg.lower() or 'invalid' in error_msg.lower():
                raise ValidationError({'url': 'Please provide a valid URL'})
            raise ValidationError({'detail': f'Failed to create tool: {error_msg}'})

