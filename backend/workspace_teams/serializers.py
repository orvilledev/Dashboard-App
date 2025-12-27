from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Team, TeamMember, TeamInvite


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'team', 'joined_at']


class TeamInviteSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamInvite
        fields = ['id', 'team', 'email', 'invited_by', 'invited_by_name', 'status', 'created_at', 'expires_at']
        read_only_fields = ['id', 'team', 'invited_by', 'status', 'created_at']
    
    def get_invited_by_name(self, obj):
        if obj.invited_by:
            return f"{obj.invited_by.first_name} {obj.invited_by.last_name}".strip() or obj.invited_by.username
        return None


class TeamSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_by', 'created_by_name', 'members_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.count()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

