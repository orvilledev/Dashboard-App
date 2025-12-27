from django.contrib import admin
from django.contrib import messages
from users.models import User
from .models import Team, TeamMember, TeamInvite


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'joined_at')
    list_filter = ('role', 'team')
    search_fields = ('user__email', 'user__username')
    ordering = ('-joined_at',)
    list_editable = ('role',)


@admin.register(TeamInvite)
class TeamInviteAdmin(admin.ModelAdmin):
    list_display = ('email', 'team', 'invited_by_email', 'status', 'created_at', 'expires_at')
    list_filter = ('status', 'team')
    search_fields = ('email',)
    ordering = ('-created_at',)
    list_editable = ('status',)
    
    actions = ['approve_invites', 'cancel_invites', 'resend_invites']
    
    def invited_by_email(self, obj):
        return obj.invited_by.email if obj.invited_by else '-'
    invited_by_email.short_description = 'Invited By'
    
    @admin.action(description='Approve selected invites (add users to team)')
    def approve_invites(self, request, queryset):
        from django.db.models import Q
        
        approved_count = 0
        errors = []
        
        for invite in queryset.filter(status='pending'):
            try:
                # Find user by email OR username (some users have email in username)
                user = User.objects.filter(
                    Q(email__iexact=invite.email) | Q(username__iexact=invite.email)
                ).first()
                
                if not user:
                    # Create new user with this email
                    user = User.objects.create(
                        username=invite.email,
                        email=invite.email,
                        first_name=invite.email.split('@')[0].title(),
                    )
                else:
                    # Update email if empty
                    if not user.email:
                        user.email = invite.email
                        user.save()
                
                # Check if already a member
                if TeamMember.objects.filter(team=invite.team, user=user).exists():
                    invite.status = 'accepted'
                    invite.save()
                    errors.append(f'{invite.email} is already a member')
                    continue
                
                # Add as team member
                TeamMember.objects.create(
                    team=invite.team,
                    user=user,
                    role='member'
                )
                
                # Mark invite as accepted
                invite.status = 'accepted'
                invite.save()
                approved_count += 1
                
            except Exception as e:
                errors.append(f'Error processing {invite.email}: {str(e)}')
        
        if approved_count:
            self.message_user(request, f'Successfully approved {approved_count} invite(s) and added users to team.', messages.SUCCESS)
        if errors:
            self.message_user(request, f'Errors: {"; ".join(errors)}', messages.WARNING)
    
    @admin.action(description='Cancel selected invites')
    def cancel_invites(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(request, f'{updated} invite(s) cancelled.', messages.SUCCESS)
    
    @admin.action(description='Mark selected invites as pending (resend)')
    def resend_invites(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        
        updated = queryset.update(
            status='pending',
            expires_at=timezone.now() + timedelta(days=7)
        )
        self.message_user(request, f'{updated} invite(s) marked as pending with new expiry.', messages.SUCCESS)
