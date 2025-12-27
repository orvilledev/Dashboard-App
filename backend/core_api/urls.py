from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from toollinks.views import ToolLinkViewSet
from workspace_documents.views import DocumentViewSet
from workspace_tasks.views import TaskViewSet
from workspace_teams.views import TeamViewSet, TeamMemberViewSet, TeamInviteViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tools', ToolLinkViewSet, basename='tool')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'members', TeamMemberViewSet, basename='member')
router.register(r'invites', TeamInviteViewSet, basename='invite')

urlpatterns = [
    path('', include(router.urls)),
]

