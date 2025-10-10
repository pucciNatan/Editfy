from django.db.models import Count, Q
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, MessageSerializer
)
from .permissions import IsConversationParticipant

class ConversationViewSet(mixins.CreateModelMixin,
                          mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Conversation.objects.all()

    def get_queryset(self):
        u = self.request.user
        return (Conversation.for_user(u)
                .annotate(unread_count=Count("messages", filter=~Q(messages__read_by=u)))
                .select_related("user1", "user2"))

    def get_serializer_class(self):
        return ConversationCreateSerializer if self.action == "create" else ConversationSerializer

    @action(detail=True, methods=["get", "post"],
            permission_classes=[IsAuthenticated, IsConversationParticipant])
    def messages(self, request, pk=None):
        convo = self.get_object()
        if request.method == "GET":
            qs = convo.messages.select_related("sender").order_by("-created_at")
            page = self.paginate_queryset(qs)
            ser = MessageSerializer(page or qs, many=True)
            return self.get_paginated_response(ser.data) if page else Response(ser.data)
        data = request.data.copy()
        data["conversation"] = str(convo.id)
        ser = MessageSerializer(data=data, context={"request": request})
        ser.is_valid(raise_exception=True)
        msg = ser.save()
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"],
            permission_classes=[IsAuthenticated, IsConversationParticipant])
    def mark_read(self, request, pk=None):
        convo = self.get_object()
        u = request.user
        # marca todas como lidas
        for m in convo.messages.exclude(read_by=u):
            m.read_by.add(u)
        return Response({"status": "ok"})

class MessageViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    queryset = Message.objects.select_related("conversation", "sender")
