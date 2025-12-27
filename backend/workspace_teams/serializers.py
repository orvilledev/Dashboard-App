from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Team, TeamMember, TeamInvite, TeamJoinRequest


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'team', 'joined_at']


class TeamInviteSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    team_description = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamInvite
        fields = ['id', 'team', 'team_name', 'team_description', 'email', 'invited_by', 'invited_by_name', 'status', 'created_at', 'expires_at']
        read_only_fields = ['id', 'invited_by', 'status', 'created_at']  # Removed 'team' to allow it during creation
    
    def get_invited_by_name(self, obj):
        if obj.invited_by:
            return f"{obj.invited_by.first_name} {obj.invited_by.last_name}".strip() or obj.invited_by.username
        return None
    
    def get_team_name(self, obj):
        return obj.team.name if obj.team else None
    
    def get_team_description(self, obj):
        return obj.team.description if obj.team else None


class TeamSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    has_pending_request = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_by', 'created_by_name', 'members_count', 'is_member', 'user_role', 'has_pending_request', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.count()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user).exists()
        return False
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            member = obj.members.filter(user=request.user).first()
            return member.role if member else None
        return None
    
    def get_has_pending_request(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.join_requests.filter(user=request.user, status='pending').exists()
        return False


class TeamJoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    team_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamJoinRequest
        fields = ['id', 'team', 'team_name', 'user', 'user_id', 'message', 'status', 'reviewed_by', 'reviewed_by_name', 'created_at', 'reviewed_at']
        read_only_fields = ['id', 'reviewed_by', 'reviewed_at', 'created_at']
    
    def get_team_name(self, obj):
        return obj.team.name if obj.team else None
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip() or obj.reviewed_by.username
        return None

