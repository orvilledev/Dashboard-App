from rest_framework import serializers
from .models import User, LeaveSchedule


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'clerk_id', 'email', 'username',
            'first_name', 'last_name', 'full_name',
            'avatar_url', 'is_admin', 'date_joined'
        ]
        read_only_fields = ['id', 'clerk_id', 'date_joined']
    
    def get_full_name(self, obj):
        # Return full name if available, otherwise use email (never use username/Clerk ID)
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name
        # Fallback to email instead of username (username is often a Clerk ID)
        return obj.email or obj.username
    
    def get_is_admin(self, obj):
        """Superusers and staff automatically have admin status in the dashboard."""
        return obj.is_admin or obj.is_superuser or obj.is_staff


class LeaveScheduleSerializer(serializers.ModelSerializer):
    """Serializer for leave schedules."""
    
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveSchedule
        fields = [
            'id', 'user', 'user_name', 'start_date', 'end_date',
            'leave_type', 'reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Return user's full name."""
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.email or obj.user.username
    
    def validate(self, data):
        """Validate that end_date is after start_date."""
        # Get start_date and end_date from data or instance (for updates)
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # If updating, get missing dates from the instance
        if self.instance:
            start_date = start_date if 'start_date' in data else self.instance.start_date
            end_date = end_date if 'end_date' in data else self.instance.end_date
        
        # Validate dates if both are present
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after or equal to start date.'
                })
        
        return data

