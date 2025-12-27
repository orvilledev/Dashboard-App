from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from users.views import UserViewSet
from toollinks.views import ToolLinkViewSet
from workspace_documents.views import DocumentViewSet
from workspace_tasks.views import TaskViewSet, TaskTemplateViewSet
from workspace_teams.views import TeamViewSet, TeamMemberViewSet, TeamInviteViewSet, TeamJoinRequestViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tools', ToolLinkViewSet, basename='tool')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-templates', TaskTemplateViewSet, basename='task-template')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'members', TeamMemberViewSet, basename='member')
router.register(r'invites', TeamInviteViewSet, basename='invite')
router.register(r'join-requests', TeamJoinRequestViewSet, basename='join-request')

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint that lists all available endpoints."""
    from django.conf import settings
    from django.http import HttpResponse
    
    # Check if this is a browser request (wants HTML) or API request (wants JSON)
    accept_header = request.META.get('HTTP_ACCEPT', '')
    
    # If browser is requesting HTML, return a nice HTML page
    if 'text/html' in accept_header or not accept_header:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AMZPulse API v1</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: #f5f5f5;
                    color: #000000;
                    min-height: 100vh;
                    padding: 40px 20px;
                }}
                .container {{
                    max-width: 1000px;
                    margin: 0 auto;
                }}
                .header {{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 40px;
                }}
                .logo {{
                    width: 48px;
                    height: 48px;
                    background: #2d2d2d;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }}
                .logo span {{
                    color: white;
                    font-family: serif;
                    font-weight: bold;
                    font-size: 24px;
                }}
                .header-content h1 {{
                    font-family: serif;
                    font-weight: bold;
                    font-size: 32px;
                    color: #2d2d2d;
                    margin-bottom: 4px;
                }}
                .header-content .subtitle {{
                    color: #4a4a4a;
                    font-size: 14px;
                }}
                .version-badge {{
                    display: inline-block;
                    background: #e5e5e5;
                    color: #4a4a4a;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-top: 8px;
                }}
                .card {{
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 32px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    margin-bottom: 24px;
                }}
                .info-box {{
                    background: #f5f5f5;
                    border: 1px solid #d3d3d3;
                    border-left: 4px solid #2d2d2d;
                    padding: 16px 20px;
                    border-radius: 8px;
                    margin-bottom: 32px;
                }}
                .info-box p {{
                    margin: 0;
                    color: #000000;
                    font-size: 14px;
                    line-height: 1.6;
                }}
                .info-box code {{
                    background: #e5e5e5;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #2d2d2d;
                }}
                .section-title {{
                    font-size: 20px;
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #d3d3d3;
                }}
                .endpoints-grid {{
                    display: grid;
                    gap: 12px;
                }}
                .endpoint {{
                    background: #ffffff;
                    border: 1px solid #d3d3d3;
                    padding: 16px 20px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s ease;
                }}
                .endpoint:hover {{
                    background: #f5f5f5;
                    border-color: #2d2d2d;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }}
                .endpoint-name {{
                    font-weight: 600;
                    color: #000000;
                    font-size: 16px;
                }}
                .endpoint-path {{
                    background: #e5e5e5;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #2d2d2d;
                    font-weight: 500;
                }}
                .frontend-link {{
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                    padding: 12px 24px;
                    background: #2d2d2d;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }}
                .frontend-link:hover {{
                    background: #1a1a1a;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }}
                @media (max-width: 768px) {{
                    body {{
                        padding: 20px 16px;
                    }}
                    .card {{
                        padding: 24px 20px;
                    }}
                    .endpoint {{
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }}
                    .endpoint-path {{
                        width: 100%;
                        text-align: left;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <span>A</span>
                    </div>
                    <div class="header-content">
                        <h1>AMZPulse API</h1>
                        <div class="subtitle">Workspace Manager API</div>
                        <span class="version-badge">Version v1</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="info-box">
                        <p><strong>ℹ️ Note:</strong> All endpoints require authentication. Include your JWT token in the Authorization header as: <code>Authorization: Bearer &lt;your-token&gt;</code></p>
                    </div>
                    
                    <h2 class="section-title">Available Endpoints</h2>
                    <div class="endpoints-grid">
                        <div class="endpoint">
                            <span class="endpoint-name">Users</span>
                            <span class="endpoint-path">/api/v1/users/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Tools</span>
                            <span class="endpoint-path">/api/v1/tools/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Documents</span>
                            <span class="endpoint-path">/api/v1/documents/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Tasks</span>
                            <span class="endpoint-path">/api/v1/tasks/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Teams</span>
                            <span class="endpoint-path">/api/v1/teams/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Members</span>
                            <span class="endpoint-path">/api/v1/members/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Invites</span>
                            <span class="endpoint-path">/api/v1/invites/</span>
                        </div>
                        <div class="endpoint">
                            <span class="endpoint-name">Join Requests</span>
                            <span class="endpoint-path">/api/v1/join-requests/</span>
                        </div>
                    </div>
                    
                    <a href="{frontend_url}" class="frontend-link">
                        <span>→</span>
                        <span>Go to Frontend Application</span>
                    </a>
                </div>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content, content_type='text/html')
    
    # For API requests, return JSON
    return Response({
        'users': '/api/v1/users/',
        'tools': '/api/v1/tools/',
        'documents': '/api/v1/documents/',
        'tasks': '/api/v1/tasks/',
        'teams': '/api/v1/teams/',
        'members': '/api/v1/members/',
        'invites': '/api/v1/invites/',
        'join-requests': '/api/v1/join-requests/',
        'message': 'All endpoints require authentication. Include your JWT token in the Authorization header.'
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('', include(router.urls)),
]

