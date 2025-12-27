from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'clerk_id', 'email', 'username',
            'first_name', 'last_name', 'full_name',
            'avatar_url', 'is_admin', 'date_joined'
        ]
        read_only_fields = ['id', 'clerk_id', 'date_joined']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

