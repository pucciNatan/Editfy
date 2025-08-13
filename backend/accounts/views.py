from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    EditorSignupSerializer, ContractorSignupSerializer, AccountMeSerializer
)

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
