# chat/views.py
from django.db import transaction
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField, Value
from django.db.models.functions import Coalesce

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
)
from .permissions import IsConversationParticipant


class ConversationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    queryset = Conversation.objects.all()

    def get_queryset(self):
        u = self.request.user

        # Tenta usar um manager/qs custom (for_user). Se não existir, filtra manualmente.
        try:
            base = Conversation.for_user(u).select_related("user1", "user2")
        except AttributeError:
            base = (
                Conversation.objects.filter(Q(user1=u) | Q(user2=u))
                .select_related("user1", "user2")
                .distinct()
            )

        # Subquery contando apenas mensagens:
        # - desta conversa
        # - NÃO enviadas por mim
        # - que ainda NÃO me têm em read_by
        unread_subq = (
            Message.objects.filter(conversation=OuterRef("pk"))
            .exclude(sender=u)
            .exclude(read_by=u)
            .values("conversation")
            .annotate(c=Count("id"))
            .values("c")[:1]
        )

        return base.annotate(
            unread_count=Coalesce(
                Subquery(unread_subq, output_field=IntegerField()),
                Value(0),
                output_field=IntegerField(),
            )
        )

    def get_serializer_class(self):
        return (
            ConversationCreateSerializer
            if self.action == "create"
            else ConversationSerializer
        )

    @action(
        detail=True,
        methods=["get", "post"],
        permission_classes=[IsAuthenticated, IsConversationParticipant],
    )
    def messages(self, request, pk=None):
        convo = self.get_object()

        if request.method == "GET":
            qs = convo.messages.select_related("sender").order_by("-created_at")
            page = self.paginate_queryset(qs)
            ser = MessageSerializer(page or qs, many=True, context={"request": request})
            return (
                self.get_paginated_response(ser.data)
                if page
                else Response(ser.data, status=status.HTTP_200_OK)
            )

        # POST (criar mensagem)
        data = request.data.copy()
        data["conversation"] = str(convo.id)
        ser = MessageSerializer(data=data, context={"request": request})
        ser.is_valid(raise_exception=True)
        msg = ser.save()
        return Response(
            MessageSerializer(msg, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsConversationParticipant],
        url_path="mark_read",
    )
    @transaction.atomic
    def mark_read(self, request, pk=None):
        convo = self.get_object()
        u = request.user

        ids = list(
            Message.objects
            .filter(conversation=convo)
            .exclude(sender=u)
            .exclude(read_by=u)
            .values_list("id", flat=True)
        )
        if not ids:
            return Response({"marked": 0}, status=status.HTTP_200_OK)

        through = Message.read_by.through
        rows = [through(account_id=u.id, message_id=mid) for mid in ids]
        through.objects.bulk_create(rows, ignore_conflicts=True)

        return Response({"marked": len(ids)}, status=status.HTTP_200_OK)


class MessageViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    queryset = Message.objects.select_related("conversation", "sender")
