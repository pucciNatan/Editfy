# backend/chat/admin.py
from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user1", "user2", "created_at")
    search_fields = (
        "user1__full_name",
        "user1__email",
        "user2__full_name",
        "user2__email",
    )
    raw_id_fields = ("user1", "user2")
    ordering = ("-created_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "short_text", "created_at")
    search_fields = (
        "text",
        "sender__full_name",
        "sender__email",
        "conversation__user1__full_name",
        "conversation__user2__full_name",
    )
    raw_id_fields = ("conversation", "sender", "read_by")
    list_filter = ("created_at",)
    ordering = ("-created_at",)

    def short_text(self, obj):
        if not obj.text:
            return "(sem texto)"
        return (obj.text[:60] + "…") if len(obj.text) > 60 else obj.text

    short_text.short_description = "Texto"
