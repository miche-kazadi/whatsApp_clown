"""
ASGI config for backend_whatsApp project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chats.middleware import TokenAuthMiddleware # Importe ton nouveau middleware
import chats.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_whatsApp.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware( # Enveloppe ici !
        URLRouter(
            chats.routing.websocket_urlpatterns
        )
    ),
})