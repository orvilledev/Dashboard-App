from django.contrib import admin
from .models import ToolLink, ToolFavorite


@admin.register(ToolLink)
class ToolLinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'url', 'is_active', 'created_by', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'url')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ToolFavorite)
class ToolFavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'tool', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__username', 'tool__name')
    ordering = ('-created_at',)
