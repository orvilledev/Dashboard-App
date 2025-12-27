import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User


class ClerkJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for validating Clerk JWT tokens.
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        try:
            # Extract token from 'Bearer <token>'
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None
        
        try:
            # Decode the JWT token
            # In production, you should verify with Clerk's public key
            if settings.CLERK_PEM_PUBLIC_KEY:
                payload = jwt.decode(
                    token,
                    settings.CLERK_PEM_PUBLIC_KEY,
                    algorithms=['RS256'],
                    options={'verify_aud': False}
                )
            else:
                # For development, decode without verification
                payload = jwt.decode(
                    token,
                    options={'verify_signature': False}
                )
            
            # Get or create user from Clerk data
            user = User.get_or_create_from_clerk(payload)
            
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication error: {str(e)}')

