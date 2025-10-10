from rest_framework.permissions import BasePermission

class IsConversationParticipant(BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user1_id") and hasattr(obj, "user2_id"):
            return request.user.id in (obj.user1_id, obj.user2_id)
        if hasattr(obj, "conversation"):
            c = obj.conversation
            return request.user.id in (c.user1_id, c.user2_id)
        return False
