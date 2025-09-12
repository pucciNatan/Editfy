from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsContractorOwnerOrReadOnly(BasePermission):
    # Leitura: liberada (qualquer um)
    # Escrita/Exclusão: somente o contratante dono da vaga ou staff
    
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if getattr(user, "is_staff", False):
            return True
        return obj.contractor_id == getattr(user, "id", None)
