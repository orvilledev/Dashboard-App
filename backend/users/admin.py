from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_admin', 'is_staff', 'date_joined')
    list_filter = ('is_admin', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'clerk_id')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Clerk Info', {'fields': ('clerk_id', 'avatar_url', 'is_admin')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Clerk Info', {'fields': ('clerk_id', 'avatar_url', 'is_admin')}),
    )
