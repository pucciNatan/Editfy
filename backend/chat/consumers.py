import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Conversation, Message

class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.group_name = None  # evita erro no disconnect
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        user = self.scope["user"]

        if not user or isinstance(user, AnonymousUser):
            await self.close(); return

        allowed = await self._is_participant(user.id, self.conversation_id)
        if not allowed:
            await self.close(); return

        self.group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # >>> ecoa o subprotocol se o cliente enviou
        protocols = (self.scope.get("subprotocols") or [])
        if protocols:
            await self.accept(subprotocol=protocols[0])
        else:
            await self.accept()

    async def disconnect(self, code):
        # Evita AttributeError quando a conexão é rejeitada no connect()
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event = content.get("event")
        if event == "message.send":
            text = content.get("text", "")
            attachment_url = content.get("attachment_url", "")
            msg = await self._create_message(self.scope["user"].id, self.conversation_id, text, attachment_url)
            payload = {"event": "message.new", "message": msg}
            await self.channel_layer.group_send(self.group_name, {"type": "chat.message", "payload": payload})
        elif event == "typing":
            await self.channel_layer.group_send(self.group_name, {"type": "chat.message", "payload": {"event": "typing", "user_id": self.scope["user"].id}})
        elif event == "read":
            await self._mark_all_read(self.scope["user"].id, self.conversation_id)
            await self.channel_layer.group_send(self.group_name, {"type": "chat.message", "payload": {"event": "read", "user_id": self.scope["user"].id}})

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    # DB helpers
    @database_sync_to_async
    def _is_participant(self, user_id, conversation_id):
        try:
            c = Conversation.objects.get(id=conversation_id)
            return user_id in (c.user1_id, c.user2_id)
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def _create_message(self, user_id, conversation_id, text, attachment_url):
        m = Message.objects.create(conversation_id=conversation_id, sender_id=user_id, text=text or "", attachment_url=attachment_url or "")
        return {"id": m.id, "text": m.text, "attachment_url": m.attachment_url, "sender_id": m.sender_id, "created_at": m.created_at.isoformat()}

    @database_sync_to_async
    def _mark_all_read(self, user_id, conversation_id):
        for m in Message.objects.filter(conversation_id=conversation_id).exclude(read_by__id=user_id):
            m.read_by.add(user_id)
