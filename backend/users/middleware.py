import jwt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class ClerkJWTAuthMiddleware(MiddlewareMixin):
    """
    Middleware to attach Clerk user data to requests.
    This is optional - the authentication class handles the main logic.
    """
    
    def process_request(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            request.clerk_user = None
            return
        
        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                request.clerk_user = None
                return
            
            # Decode without verification for middleware
            # Actual verification happens in the authentication class
            payload = jwt.decode(
                token,
                options={'verify_signature': False}
            )
            request.clerk_user = payload
            
        except Exception:
            request.clerk_user = None

