"""
URL configuration for amzpulse project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def api_root(request):
    """Simple API root endpoint with HTML documentation."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AMZPulse API</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
            }}
            .container {{
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #333;
                margin-bottom: 10px;
            }}
            .version {{
                color: #666;
                font-size: 14px;
                margin-bottom: 30px;
            }}
            .section {{
                margin-bottom: 25px;
            }}
            .section h2 {{
                color: #444;
                font-size: 18px;
                margin-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 5px;
            }}
            .endpoint {{
                background: #f9f9f9;
                padding: 10px 15px;
                margin: 5px 0;
                border-radius: 4px;
                border-left: 3px solid #4CAF50;
            }}
            .endpoint strong {{
                color: #2c3e50;
            }}
            .endpoint code {{
                background: #e8e8e8;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                color: #c7254e;
            }}
            .frontend-link {{
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 500;
            }}
            .frontend-link:hover {{
                background: #45a049;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 AMZPulse API</h1>
            <div class="version">Version v1</div>
            
            <div class="section">
                <h2>Quick Links</h2>
                <div class="endpoint">
                    <strong>Admin Panel:</strong> <code>/admin/</code>
                </div>
                <div class="endpoint">
                    <strong>API Base:</strong> <code>/api/v1/</code>
                </div>
            </div>
            
            <div class="section">
                <h2>API Endpoints</h2>
                <div class="endpoint">
                    <strong>Users:</strong> <code>/api/v1/users/</code>
                </div>
                <div class="endpoint">
                    <strong>Tools:</strong> <code>/api/v1/tools/</code>
                </div>
                <div class="endpoint">
                    <strong>Documents:</strong> <code>/api/v1/documents/</code>
                </div>
                <div class="endpoint">
                    <strong>Tasks:</strong> <code>/api/v1/tasks/</code>
                </div>
                <div class="endpoint">
                    <strong>Teams:</strong> <code>/api/v1/teams/</code>
                </div>
                <div class="endpoint">
                    <strong>Members:</strong> <code>/api/v1/members/</code>
                </div>
            </div>
            
            <a href="{frontend_url}" class="frontend-link">→ Go to Frontend Application</a>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('core_api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
