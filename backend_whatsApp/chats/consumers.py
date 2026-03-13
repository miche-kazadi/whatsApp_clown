import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        return User.objects.get(id=access_token['user_id'])
    except Exception as e:
        print(f"Erreur token: {e}")
        return None
    
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Récupère le token depuis la chaîne de requête (query string)
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        # Utilise la fonction qu'on vient d'ajouter
        user = await get_user_from_token(token)
        
        if user and user.is_authenticated:
            self.user = user
            self.room_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
           
            await self.accept()
            print(f"Connexion établie pour : {self.user.username}")
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get("type")

        if event_type == "typing":
            receiver_id = data["receiver"]

            # notifier le destinataire que l'expéditeur est en train d'écrire
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "typing_event",
                    "sender": self.user.username
                }
            )

        elif event_type == "message":
            message = data["message"]
            receiver_id = data["receiver"]

            # sauvegarder le message
            await self.save_message(receiver_id, message)

            # envoyer au destinataire
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": self.user.id,
                    "receiver": receiver_id
                }
            )

            # envoyer à l'expéditeur
            await self.channel_layer.group_send(
                f"user_{self.user.id}",
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": self.user.id,
                    "receiver": receiver_id
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"],
            "sender": event["sender"],
            "receiver": event["receiver"]
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "sender": event["sender"]
        }))

    @database_sync_to_async
    def save_message(self, receiver_id, message):
        Message.objects.create(
            sender=self.user,
            receiver_id=receiver_id,
            content=message
        )
