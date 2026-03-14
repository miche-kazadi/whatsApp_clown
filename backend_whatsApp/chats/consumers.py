import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs

# --- FONCTIONS UTILES HORS CLASSE ---
@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        return User.objects.get(id=access_token['user_id'])
    except Exception:
        return None

@database_sync_to_async
def db_mark_messages_as_read(receiver, sender_id):
    Message.objects.filter(sender_id=sender_id, receiver=receiver, is_read=False).update(is_read=True)

@database_sync_to_async
def db_save_message(sender, receiver_id, content):
    return Message.objects.create(sender=sender, receiver_id=receiver_id, content=content)

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        print(f"DEBUG: Tentative de validation du token: {token_string[:10]}...")
        access_token = AccessToken(token_string)
        user = User.objects.get(id=access_token['user_id'])
        print(f"DEBUG: Utilisateur trouvé: {user.username}")
        return user
    except Exception as e:
        print(f"DEBUG: Échec validation token: {str(e)}")
        return None

# --- CLASSE CONSUMER ---
class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        try:
            query_string = self.scope['query_string'].decode()
            params = parse_qs(query_string)
            token = params.get('token', [None])[0]


            if token and token.startswith('Bearer '):
                token = token.split(' ')[1]
            # 2. Valider le token
            user = await get_user_from_token(token)
            
            if user and user.is_authenticated:
                self.user = user
                self.room_group_name = f"user_{self.user.id}"
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            
                await self.accept()
                print(f"DEBUG: Connexion etabli {self.user.username} ")
            else:
                print("DEBUG: Connexion refusée (token invalide)")
                await self.close()
        except Exception as e:
            print(f"ERREUR CRITIQUE CONNECT: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            event_type = data.get("type")

            if event_type == "typing":
                receiver_id = data.get("receiver")
                if receiver_id:
                    await self.channel_layer.group_send(f"user_{receiver_id}", {"type": "typing_event", "sender": self.user.username})

            elif event_type == "message":
                message = data.get("message")
                receiver_id = data.get("receiver")
                if message and receiver_id:
                    await db_save_message(self.user, receiver_id, message)
                    payload = {"type": "chat_message", "message": message, "sender": self.user.id, "receiver": receiver_id}
                    await self.channel_layer.group_send(f"user_{receiver_id}", payload)
                    await self.channel_layer.group_send(f"user_{self.user.id}", payload)
                    print(f"DEBUG: Message recu du frontent {self.user.username} : {text_data}")
                try:
                    data = json.loads(text_data)
                    print(f"DEBUG: Payload reçu pour message: {data}")
                except Exception as e:
                    print(f"DEBUG: Erreur lors de l'envoi du payload: {e}")

            elif event_type == "read":
                sender_id = data.get("sender")
                if sender_id:
                    await db_mark_messages_as_read(self.user, sender_id)
                    await self.channel_layer.group_send(f"user_{sender_id}", {"type": "message_read", "reader": self.user.id})
            
            else:
                print(f"Type d'événement inconnu reçu: {event_type}")

        except json.JSONDecodeError:
            print("Erreur : Impossible de décoder le JSON reçu.")
        except Exception as e:
            print(f"Erreur inattendue dans receive: {e}")

    # --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"],
            "sender": event["sender"],
            "receiver": event["receiver"]
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({"type": "typing", **event}))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({"type": "read", **event}))

    async def websocket_receive(self, message):
        await super().websocket_receive(message)

    async def send_json(self, content, close=False):
        await self.send(text_data=json.dumps(content), close=close)