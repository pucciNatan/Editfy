from rest_framework import serializers
from accounts.models import Account
from .models import Conversation, Message

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "nick", "email", "profile_photo_url", "role"]

class ConversationSerializer(serializers.ModelSerializer):
    user1 = ParticipantSerializer(read_only=True)
    user2 = ParticipantSerializer(read_only=True)
    unread_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "user1", "user2", "created_at", "unread_count"]

class ConversationCreateSerializer(serializers.Serializer):
    other_user_id = serializers.IntegerField()

    def create(self, validated_data):
        me = self.context["request"].user
        other_id = validated_data["other_user_id"]
        if me.id == other_id:
            raise serializers.ValidationError("Você não pode criar chat consigo mesmo.")
        user1_id, user2_id = sorted([me.id, other_id])
        convo, _ = Conversation.objects.get_or_create(user1_id=user1_id, user2_id=user2_id)
        return convo

    def to_representation(self, instance):
        return ConversationSerializer(instance).data

class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "text", "attachment_url", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)
