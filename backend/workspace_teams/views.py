from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.models import User
from users.serializers import UserSerializer
from .models import Team, TeamMember, TeamInvite
from .serializers import TeamSerializer, TeamMemberSerializer, TeamInviteSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow admins to edit."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_admin


class IsAuthenticatedOrReadOnlyInDebug(permissions.BasePermission):
    """
    Allow read access without authentication in DEBUG mode.
    Require authentication for write operations always.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            # Allow read access in DEBUG mode without auth
            if settings.DEBUG:
                return True
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated


class TeamViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teams."""
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        # Add creator as admin member
        TeamMember.objects.create(
            team=team,
            user=self.request.user,
            role='admin'
        )


class TeamMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team members."""
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def get_queryset(self):
        return TeamMember.objects.select_related('user', 'team')
    
    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Get all team members (users in the system)."""
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change a member's role."""
        member = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['admin', 'member']:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member.role = new_role
        member.save()
        
        # Also update the user's is_admin flag
        member.user.is_admin = (new_role == 'admin')
        member.user.save()
        
        return Response(TeamMemberSerializer(member).data)


class TeamInviteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team invitations."""
    queryset = TeamInvite.objects.filter(status='pending')
    serializer_class = TeamInviteSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(
            invited_by=self.request.user,
            expires_at=timezone.now() + timedelta(days=7)
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an invitation."""
        invite = self.get_object()
        invite.status = 'cancelled'
        invite.save()
        return Response({'status': 'cancelled'})
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend an invitation (extend expiry)."""
        invite = self.get_object()
        invite.expires_at = timezone.now() + timedelta(days=7)
        invite.save()
        # Here you would trigger an email notification
        return Response({'status': 'resent', 'expires_at': invite.expires_at})
