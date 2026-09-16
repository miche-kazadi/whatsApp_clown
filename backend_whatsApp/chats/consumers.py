import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Message, Profil


@database_sync_to_async
def save_message(sender_id, receiver_id, content):
    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)
    return Message.objects.create(sender=sender, receiver=receiver, content=content)


@database_sync_to_async
def set_online(user, status):
    profil, _ = Profil.objects.get_or_create(user=user)
    profil.is_online = status
    profil.save()


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        # Groupe personnel pour recevoir messages
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        await self.accept()
        await set_online(self.user, True)

        print("✅ WebSocket connecté :", self.user.username)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        await set_online(self.user, False)
        print("⚠️ WebSocket déconnecté :", self.user.username)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get("type")

        if event_type == "message":
            receiver_id = data.get("receiver")
            message = data.get("message")

            msg = await save_message(self.user.id, receiver_id, message)

            payload = {
                "type": "chat_message",
                "id": msg.id,
                "message": message,
                "sender": self.user.id,
                "receiver": receiver_id
            }

            # Envoyer au receiver
            await self.channel_layer.group_send(f"user_{receiver_id}", payload)

            # Envoyer à l'expéditeur
            await self.channel_layer.group_send(f"user_{self.user.id}", payload)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing_event",
            "sender": event["sender"]
        }))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({
            "type": "message_read",
            "reader": event["reader"]
        }))

    @database_sync_to_async
    def set_online_status(self, status):
        try:
            profil, _ = Profil.objects.get_or_create(user=self.user)
            profil.is_online = status
            profil.save()
        except Exception as e:
            print(f"Erreur Profil status: {e}")
