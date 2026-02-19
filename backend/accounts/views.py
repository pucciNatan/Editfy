from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Account
from .serializers import AccountPublicSerializer
from .serializers import (
    EditorSignupSerializer, ContractorSignupSerializer, AccountMeSerializer, AccountUpdateSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser

from django.core.files.storage import default_storage
import os
import uuid

class EditorSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EditorSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"message": "Editor criado com sucesso.", "id": user.id}, status=status.HTTP_201_CREATED)


class ContractorSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContractorSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"message": "Contractor criado com sucesso.", "id": user.id}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(AccountMeSerializer(request.user).data)
    
class AccountUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        serializer = AccountUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AccountPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, account_id: int):
        try:
            user = Account.objects.get(pk=account_id)
        except Account.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AccountPublicSerializer(user).data, status=status.HTTP_200_OK)

class ProfilePhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        # nome: profile_photos/<user_id>_<uuid>.<ext>
        ext = os.path.splitext(file_obj.name)[1].lower()
        filename = f"profile_photos/{request.user.id}_{uuid.uuid4().hex}{ext}"

        saved_path = default_storage.save(filename, file_obj)
        url = request.build_absolute_uri(default_storage.url(saved_path))

        user: Account = request.user
        user.profile_photo_url = url
        user.save(update_fields=["profile_photo_url"])

        return Response({"profile_photo_url": url}, status=status.HTTP_200_OK)