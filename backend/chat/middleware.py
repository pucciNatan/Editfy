# chat/middleware.py
import urllib.parse
from typing import Optional, List

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils.functional import cached_property
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings

User = get_user_model()


def _pick_token_from_subprotocols(protocols: List[str]) -> Optional[str]:
    """
    Aceita:
    - ["Bearer", "<JWT>"]  (navegadores)
    - ["Bearer <JWT>"]     (Postman/alguns clientes)
    - ["<JWT>"]            (token puro)
    """
    if not protocols:
        return None

    parts = [p.strip() for p in protocols if p and p.strip()]

    if len(parts) >= 2 and parts[0].lower() == "bearer":
        return parts[1]

    if len(parts) == 1:
        p0 = parts[0]
        if p0.lower().startswith("bearer "):
            return p0[7:].strip()
        return p0

    return None


def _extract_token_from_headers(scope) -> Optional[str]:
    """Sec-WebSocket-Protocol (com vírgula) / Authorization: Bearer <JWT>"""
    headers = dict(scope.get("headers") or [])

    swp = headers.get(b"sec-websocket-protocol")
    if swp:
        try:
            raw = swp.decode().strip()
            items = [x.strip() for x in raw.split(",") if x.strip()]
            token = _pick_token_from_subprotocols(items)
            if token:
                return token
            if raw.lower().startswith("bearer "):
                return raw[7:].strip()
            return raw if raw else None
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
    try:
        raw_qs = scope.get("query_string", b"")
        qs = urllib.parse.parse_qs(raw_qs.decode())
        token = qs.get("token", [None])[0]
        return token
    except Exception:
        return None


class JWTAuthMiddleware:
    """
    Ordem de busca:
      1) scope['subprotocols'] → ["Bearer", "<JWT>"] / etc.
      2) Sec-WebSocket-Protocol (header)
      3) Authorization: Bearer <JWT>
      4) ?token=<JWT> (querystring)
    Injeta scope['user']; inválido/ausente → AnonymousUser.
    """

    def __init__(self, inner):
        self.inner = inner

    @cached_property
    def user_id_claim(self) -> str:
        return (getattr(settings, "SIMPLE_JWT", {}) or {}).get("USER_ID_CLAIM", "user_id")

    @database_sync_to_async
    def _get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            try:
                return User.objects.get(**{User.USERNAME_FIELD: user_id})
            except User.DoesNotExist:
                return AnonymousUser()

    async def __call__(self, scope, receive, send):
        user = scope.get("user", None)

        token = _pick_token_from_subprotocols(scope.get("subprotocols") or [])
        if not token:
            token = _extract_token_from_headers(scope)
        if not token:
            token = _extract_token_from_querystring(scope)

        if token:
            try:
                access = AccessToken(token)
                uid = access.get(self.user_id_claim)
                user = await self._get_user(uid)
                scope["jwt_user_id"] = uid  # (debug)
            except Exception:
                user = AnonymousUser()

        if user is None:
            user = AnonymousUser()

        scope["user"] = user
        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    from channels.auth import AuthMiddlewareStack
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
