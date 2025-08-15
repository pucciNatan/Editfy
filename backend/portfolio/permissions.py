from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsEditorOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, "is_staff", False):
            return True
        return obj.editor_id == getattr(request.user, "id", None)

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    