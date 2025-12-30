"""
Shared utility functions for the application.
"""
import logging
from typing import Optional, Dict, Any
from django.db import models
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def get_user_admin_status(user) -> bool:
    """Check if user has admin privileges."""
    if not user or not user.is_authenticated:
        return False
    return user.is_admin or user.is_superuser or user.is_staff


def refresh_user_from_db(user):
    """Safely refresh user from database."""
    try:
        user.refresh_from_db()
    except Exception as e:
        logger.warning(f"Failed to refresh user from DB: {e}")


def create_error_response(
    message: str,
    error_detail: Optional[str] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """Create a standardized error response."""
    response_data = {'error': message}
    if error_detail:
        response_data['detail'] = error_detail
    return Response(response_data, status=status_code)


def extract_error_message(exception: Exception) -> str:
    """Extract a clean error message from an exception."""
    error_msg = str(exception)
    
    if hasattr(exception, 'detail'):
        if isinstance(exception.detail, dict):
            if 'detail' in exception.detail:
                error_msg = str(exception.detail['detail'])
            else:
                error_msg = str(exception.detail)
        else:
            error_msg = str(exception.detail)
    elif hasattr(exception, 'message_dict'):
        error_msg = str(exception.message_dict)
    
    # Clean up common error patterns
    if 'duplicate key' in error_msg.lower() or 'already exists' in error_msg.lower():
        error_msg = 'A resource with this identifier already exists.'
    elif 'Failed to create' in error_msg:
        parts = error_msg.split('Failed to create', 1)
        if len(parts) > 1:
            error_msg = parts[1].strip()
            # Remove nested error wrappers
            error_msg = error_msg.replace("{'detail':", "").replace("}", "").strip()
            if error_msg.startswith("ErrorDetail(string='"):
                error_msg = error_msg.replace("ErrorDetail(string='", "").replace("', code='invalid')", "").strip()
    
    return error_msg


def get_object_created_by_id(obj) -> Optional[int]:
    """Safely get the created_by_id from an object."""
    if hasattr(obj, 'created_by_id'):
        return obj.created_by_id
    if hasattr(obj, 'created_by') and obj.created_by:
        return obj.created_by.id if hasattr(obj.created_by, 'id') else None
    return None


def validate_hex_color(color: str) -> bool:
    """Validate if a string is a valid hex color."""
    import re
    hex_color_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    return bool(hex_color_pattern.match(str(color)))


def paginate_queryset_if_needed(queryset, request, page_size: int = 50):
    """
    Apply pagination to queryset if pagination parameters are provided.
    Returns (paginated_queryset, use_pagination, page, page_size)
    """
    use_pagination = 'page' in request.query_params or 'page_size' in request.query_params
    
    if use_pagination:
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get('page_size', page_size))
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        page = int(request.query_params.get('page', 1))
        return paginated_queryset, True, page, paginator.page_size
    
    return queryset, False, 1, None

