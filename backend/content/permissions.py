from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthorOrStaff(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        user = request.user
        if getattr(user, "is_staff", False):
            return True
        if obj.author_id == getattr(user, "id", None):
            return True
        if getattr(obj.portfolio, "editor_id", None) == getattr(user, "id", None):
            return request.method == "DELETE"
        return False
    
class IsVideoAuthorOrStaff(BasePermission):
    def has_permission(self, request, view):
        # leitura pública para vídeos
        if request.method in SAFE_METHODS:
            return True
        # criar/editar/apagar precisam de login
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if getattr(user, "is_staff", False):
            return True
        return obj.author_id == getattr(user, "id", None)