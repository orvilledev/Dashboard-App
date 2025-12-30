from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, LeaveSchedule


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_admin', 'is_staff', 'date_joined')
    list_filter = ('is_admin', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'clerk_id')
    ordering = ('-date_joined',)
    
    # Allow editing is_admin directly from the list view
    list_editable = ('is_admin',)
    
    # Bulk actions for role management
    actions = ['make_admin', 'remove_admin', 'fix_usernames']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Clerk Info', {'fields': ('clerk_id', 'avatar_url', 'is_admin')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Clerk Info', {'fields': ('clerk_id', 'avatar_url', 'is_admin')}),
    )
    
    @admin.action(description='Make selected users Admins')
    def make_admin(self, request, queryset):
        updated = queryset.update(is_admin=True)
        self.message_user(request, f'{updated} user(s) have been made admin.')
    
    @admin.action(description='Remove Admin status from selected users')
    def remove_admin(self, request, queryset):
        updated = queryset.update(is_admin=False)
        self.message_user(request, f'Admin status removed from {updated} user(s).')
    
    @admin.action(description='Fix usernames for selected users')
    def fix_usernames(self, request, queryset):
        """Fix usernames based on email or name for selected users."""
        updated_count = 0
        for user in queryset:
            old_username = user.username
            new_username = None
            
            # Generate username from email if available
            if user.email:
                new_username = User.generate_username_from_email(user.email)
            elif user.first_name or user.last_name:
                new_username = User.generate_username_from_name(user.first_name, user.last_name)
            
            if new_username:
                new_username = User.generate_unique_username(new_username)
                if new_username != user.username:
                    user.username = new_username
                    user.save()
                    updated_count += 1
        
        if updated_count > 0:
            self.message_user(
                request,
                f'Successfully updated usernames for {updated_count} user(s).',
                level='SUCCESS'
            )
        else:
            self.message_user(
                request,
                'No usernames were updated. Users need email addresses or names to generate usernames.',
                level='WARNING'
            )


@admin.register(LeaveSchedule)
class LeaveScheduleAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_date', 'end_date', 'leave_type', 'created_at')
    list_filter = ('leave_type', 'start_date', 'end_date', 'created_at')
    search_fields = ('user__email', 'user__username', 'user__first_name', 'user__last_name', 'reason')
    ordering = ('-start_date',)
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Leave Information', {
            'fields': ('user', 'start_date', 'end_date', 'leave_type', 'reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
