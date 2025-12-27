from django.contrib import admin
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


@admin.register(TeamInvite)
class TeamInviteAdmin(admin.ModelAdmin):
    list_display = ('email', 'team', 'invited_by', 'status', 'created_at', 'expires_at')
    list_filter = ('status', 'team')
    search_fields = ('email',)
    ordering = ('-created_at',)
