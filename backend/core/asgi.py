import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# 1) Inicializa Django
django_asgi_app = get_asgi_application()

# 2) Só depois importe o routing e o middleware
import chat.routing
from chat.middleware import JWTAuthMiddlewareStack  # <- usamos a pilha com sessão + JWT

# 3) Monta o ProtocolTypeRouter
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(chat.routing.websocket_urlpatterns)
    ),
})
