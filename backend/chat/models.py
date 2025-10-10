import uuid
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conv_user1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conv_user2")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=~models.Q(user1=models.F("user2")), name="conversation_distinct_users"),
            models.UniqueConstraint(fields=["user1", "user2"], name="conversation_unique_pair"),
        ]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["user1"]),
            models.Index(fields=["user2"]),
        ]

    def save(self, *args, **kwargs):
        # ordena o par para manter (user1 < user2) e garantir unicidade
        if self.user1_id and self.user2_id and self.user1_id > self.user2_id:
            self.user1_id, self.user2_id = self.user2_id, self.user1_id
        super().save(*args, **kwargs)

    @staticmethod
    def for_user(user):
        return Conversation.objects.filter(Q(user1=user) | Q(user2=user))

    def participants_ids(self):
        return {self.user1_id, self.user2_id}

    def __str__(self):
        return f"{self.user1_id}↔{self.user2_id}"

class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(Conversation, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    attachment_url = models.URLField(blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    read_by = models.ManyToManyField(User, related_name="read_messages", blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]
