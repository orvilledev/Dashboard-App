from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core_api.permissions import IsAdminOrReadOnly, IsAuthenticatedOrReadOnlyInDebug
from users.models import User
from users.serializers import UserSerializer
from .models import Team, TeamMember, TeamInvite, TeamJoinRequest
from .serializers import TeamSerializer, TeamMemberSerializer, TeamInviteSerializer, TeamJoinRequestSerializer


class TeamViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teams."""
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        # Add creator as admin member
        TeamMember.objects.create(
            team=team,
            user=self.request.user,
            role='admin'
        )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_teams(self, request):
        """Get teams where the current user is a member."""
        teams = Team.objects.filter(members__user=request.user)
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team members."""
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def get_queryset(self):
        # Return ALL team members, including admins (role='admin') and regular members (role='member')
        # No filtering is applied - all TeamMember records are included regardless of user role or admin status
        # Admins who are team members are included in the members list
        queryset = TeamMember.objects.select_related('user', 'team')
        # Ensure consistent ordering: admins and members together, ordered by joined date
        return queryset.order_by('-joined_at')
    
    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Get all team members (users in the system)."""
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_member(self, request):
        """Directly add a user as a team member by user_id or email."""
        team_id = request.data.get('team_id', 1)  # Default to team 1
        user_id = request.data.get('user_id')
        email = request.data.get('email')
        role = request.data.get('role', 'member')
        
        if role not in ['admin', 'member']:
            role = 'member'
        
        # Find the user
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif email:
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response(
                    {'error': f'No user found with email {email}. They need to sign up first, or send them an invite.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Please provide user_id or email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the team
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response(
                {'error': 'Team not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already a member
        if TeamMember.objects.filter(team=team, user=user).exists():
            return Response(
                {'error': f'{user.email} is already a member of this team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the member
        member = TeamMember.objects.create(
            team=team,
            user=user,
            role=role
        )
        
        # Update user's is_admin flag if adding as admin
        # Only set to True, never remove admin status (preserve manual Django admin settings)
        if role == 'admin' and not user.is_admin:
            user.is_admin = True
            user.save()
        
        return Response({
            'message': f'{user.email} has been added to the team',
            'member': TeamMemberSerializer(member).data
        }, status=status.HTTP_201_CREATED)
    
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
        # Only set to True if role is admin, never remove admin status (preserve manual Django admin settings)
        if new_role == 'admin' and not member.user.is_admin:
            member.user.is_admin = True
            member.user.save()
        # If changing from admin to member, don't remove is_admin flag
        # This preserves manual admin assignments made in Django admin
        
        return Response(TeamMemberSerializer(member).data)


class TeamInviteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team invitations."""
    queryset = TeamInvite.objects.filter(status='pending')
    serializer_class = TeamInviteSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyInDebug, IsAdminOrReadOnly]
    
    def perform_create(self, serializer):
        invite = serializer.save(
            invited_by=self.request.user,
            expires_at=timezone.now() + timedelta(days=7)
        )
        # Send invitation email
        self.send_invite_email(invite)
    
    def send_invite_email(self, invite):
        """Send invitation email to the invitee."""
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            invite_url = f"{frontend_url}/join-team"
            
            inviter_name = invite.invited_by.first_name or invite.invited_by.email if invite.invited_by else 'A team admin'
            team_name = invite.team.name if invite.team else 'a team'
            
            subject = f"You're invited to join {team_name} on AMZPulse"
            
            message = f"""
Hello,

{inviter_name} has invited you to join "{team_name}" on AMZPulse.

To accept this invitation:
1. Sign up or log in at {frontend_url}
2. Go to your profile menu and click "Join Team"
3. Accept the pending invitation

Or click here directly: {invite_url}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The AMZPulse Team
            """
            
            send_mail(
                subject=subject,
                message=message.strip(),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invite.email],
                fail_silently=True,  # Don't crash if email fails
            )
            print(f"Invitation email sent to {invite.email}")
        except Exception as e:
            print(f"Failed to send invitation email: {e}")
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_invites(self, request):
        """Get pending invites for the current user's email."""
        user_email = request.user.email
        invites = TeamInvite.objects.filter(
            email__iexact=user_email,
            status='pending',
            expires_at__gt=timezone.now()
        ).select_related('team', 'invited_by')
        serializer = TeamInviteSerializer(invites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """Accept an invitation and join the team."""
        invite = self.get_object()
        
        # Verify the invite is for this user's email
        if invite.email.lower() != request.user.email.lower():
            return Response(
                {'error': 'This invite is not for your email address'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if invite is still valid
        if invite.status != 'pending':
            return Response(
                {'error': 'This invite is no longer valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invite.expires_at and invite.expires_at < timezone.now():
            invite.status = 'expired'
            invite.save()
            return Response(
                {'error': 'This invite has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member
        if TeamMember.objects.filter(team=invite.team, user=request.user).exists():
            invite.status = 'accepted'
            invite.save()
            return Response(
                {'error': 'You are already a member of this team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user to the team
        member = TeamMember.objects.create(
            team=invite.team,
            user=request.user,
            role='member'
        )
        
        # Mark invite as accepted
        invite.status = 'accepted'
        invite.save()
        
        return Response({
            'message': f'Successfully joined {invite.team.name}',
            'member': TeamMemberSerializer(member).data
        })
    
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


class TeamJoinRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team join requests."""
    queryset = TeamJoinRequest.objects.all()
    serializer_class = TeamJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter join requests based on user role."""
        user = self.request.user
        if user.is_admin or user.is_superuser or user.is_staff:
            # Admins can see all pending requests for teams they admin
            admin_teams = Team.objects.filter(members__user=user, members__role='admin')
            return TeamJoinRequest.objects.filter(team__in=admin_teams, status='pending')
        else:
            # Regular users can only see their own requests
            return TeamJoinRequest.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Create a join request for a team."""
        team_id = request.data.get('team')
        message = request.data.get('message', '')
        
        if not team_id:
            return Response(
                {'error': 'Team ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if team exists
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response(
                {'error': 'Team not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is already a member
        if TeamMember.objects.filter(team=team, user=request.user).exists():
            return Response(
                {'error': 'You are already a member of this team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's already a pending request
        if TeamJoinRequest.objects.filter(team=team, user=request.user, status='pending').exists():
            return Response(
                {'error': 'You already have a pending request for this team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the join request
        join_request = TeamJoinRequest.objects.create(
            team=team,
            user=request.user,
            message=message
        )
        
        return Response(
            TeamJoinRequestSerializer(join_request).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get the current user's join requests."""
        requests = TeamJoinRequest.objects.filter(user=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_for_my_teams(self, request):
        """Get pending join requests for teams the user is an admin of."""
        admin_teams = Team.objects.filter(members__user=request.user, members__role='admin')
        pending_requests = TeamJoinRequest.objects.filter(
            team__in=admin_teams,
            status='pending'
        ).select_related('team', 'user')
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a join request (admin only)."""
        join_request = self.get_object()
        
        # Check if the user is an admin of the team
        is_team_admin = TeamMember.objects.filter(
            team=join_request.team,
            user=request.user,
            role='admin'
        ).exists()
        
        if not is_team_admin:
            return Response(
                {'error': 'Only team admins can approve join requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if join_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user to the team
        member = TeamMember.objects.create(
            team=join_request.team,
            user=join_request.user,
            role='member'
        )
        
        # Update the request
        join_request.status = 'approved'
        join_request.reviewed_by = request.user
        join_request.reviewed_at = timezone.now()
        join_request.save()
        
        return Response({
            'message': f'{join_request.user.email} has been added to {join_request.team.name}',
            'member': TeamMemberSerializer(member).data,
            'request': TeamJoinRequestSerializer(join_request).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a join request (admin only)."""
        join_request = self.get_object()
        
        # Check if the user is an admin of the team
        is_team_admin = TeamMember.objects.filter(
            team=join_request.team,
            user=request.user,
            role='admin'
        ).exists()
        
        if not is_team_admin:
            return Response(
                {'error': 'Only team admins can reject join requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if join_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the request
        join_request.status = 'rejected'
        join_request.reviewed_by = request.user
        join_request.reviewed_at = timezone.now()
        join_request.save()
        
        return Response({
            'message': f'Request from {join_request.user.email} has been rejected',
            'request': TeamJoinRequestSerializer(join_request).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a join request (user can cancel their own request)."""
        join_request = self.get_object()
        
        # Users can only cancel their own requests
        if join_request.user != request.user:
            return Response(
                {'error': 'You can only cancel your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if join_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        join_request.status = 'cancelled'
        join_request.save()
        
        return Response({
            'message': 'Join request cancelled',
            'request': TeamJoinRequestSerializer(join_request).data
        })
