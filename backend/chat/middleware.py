# chat/middleware.py
import urllib.parse
from typing import Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils.functional import cached_property

from channels.db import database_sync_to_async

from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings

User = get_user_model()


def _extract_token_from_headers(scope) -> Optional[str]:
    """
    Procura token no handshake do WS:
    - Sec-WebSocket-Protocol: "Bearer <token>" ou "<token>"
    - Authorization: "Bearer <token>" (alguns clientes enviam)
    """
    headers = dict(scope.get("headers") or [])
    # normaliza chaves para bytes em minúsculo
    # Ex.: b'sec-websocket-protocol', b'authorization'
    swp = headers.get(b"sec-websocket-protocol")
    if swp:
        try:
            val = swp.decode().strip()
            # Pode vir "Bearer <token>" OU apenas "<token>"
            if val.lower().startswith("bearer "):
                return val[7:].strip()
            return val
        except Exception:
            pass

    auth = headers.get(b"authorization")
    if auth:
        try:
            val = auth.decode().strip()
            if val.lower().startswith("bearer "):
                return val[7:].strip()
        except Exception:
            pass

    return None


def _extract_token_from_querystring(scope) -> Optional[str]:
    """
    Lê ?token=<JWT> do querystring.
    """
    try:
        raw_qs = scope.get("query_string", b"")
        qs = urllib.parse.parse_qs(raw_qs.decode())
        token = qs.get("token", [None])[0]
        return token
    except Exception:
        return None


class JWTAuthMiddleware:
    """
    Middleware ASGI para autenticar usuários em WebSockets via JWT (SimpleJWT).
    - Lê token do Sec-WebSocket-Protocol OU Authorization OU ?token=
    - Valida com SimpleJWT
    - Injeta scope['user']
    - Se não houver/for inválido → AnonymousUser (deixa o Consumer decidir)
    """

    def __init__(self, inner):
        self.inner = inner

    @cached_property
    def user_id_claim(self) -> str:
        return (getattr(settings, "SIMPLE_JWT", {}) or {}).get("USER_ID_CLAIM", "user_id")

    @database_sync_to_async
    def _get_user(self, user_id):
        try:
            return User.objects.get(**{User.USERNAME_FIELD: user_id}) if User.USERNAME_FIELD == self.user_id_claim else User.objects.get(pk=user_id)
        except User.DoesNotExist:
            try:
                return User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return AnonymousUser()

    async def __call__(self, scope, receive, send):
        # Se já tiver user (ex.: via Session), mantemos
        user = scope.get("user", None)

        token = _extract_token_from_headers(scope) or _extract_token_from_querystring(scope)
        if token:
            try:
                access = AccessToken(token)
                uid = access.get(self.user_id_claim)
                user = await self._get_user(uid)
            except Exception:
                # Token inválido/expirado → Anonymous
                user = AnonymousUser()

        if user is None:
            user = AnonymousUser()

        scope["user"] = user
        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    from channels.auth import AuthMiddlewareStack
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
