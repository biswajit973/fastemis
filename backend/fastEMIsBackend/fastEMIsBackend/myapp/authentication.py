from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class AgentSingleSessionJWTAuthentication(JWTAuthentication):
    """
    Enforce one active agent session at a time.
    For admin users, access token JTI must match the latest JTI stored in DB.
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not getattr(user, 'is_admin', False):
            return user

        token_jti = str(validated_token.get('jti') or '').strip()
        active_jti = str(getattr(user, 'active_agent_access_jti', '') or '').strip()
        if not token_jti or not active_jti or token_jti != active_jti:
            raise AuthenticationFailed('Session expired. Please log in again.', code='token_not_valid')
        return user
