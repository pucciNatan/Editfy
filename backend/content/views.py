from rest_framework import viewsets, permissions
from .models import Video
from .serializers import VideoSerializer
from rest_framework.response import Response
from rest_framework import status
from .models import RecommendationPost
from .serializers import RecommendationPostWriteSerializer, RecommendationPostReadSerializer
from .permissions import IsAuthorOrStaff
from .permissions import IsVideoAuthorOrStaff
from portfolio.models import Portfolio
from rest_framework.exceptions import ValidationError

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by("-id")
    serializer_class = VideoSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsVideoAuthorOrStaff()]

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role", None) != "EDITOR" and not getattr(user, "is_staff", False):
            raise ValidationError({"detail": "Apenas contas com papel de EDITOR podem publicar vídeos."})

        video = serializer.save(author=user)

        try:
            p = Portfolio.objects.get(editor=user)
        except Portfolio.DoesNotExist:
            raise ValidationError({"detail": "Portfólio do editor não encontrado."})
        p.videos.add(video)

    def perform_update(self, serializer):
        serializer.save(author=self.get_object().author)


class RecommendationPostViewSet(viewsets.ModelViewSet):
    queryset = RecommendationPost.objects.select_related("portfolio", "author").all()
    permission_classes = [IsAuthorOrStaff]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RecommendationPostWriteSerializer
        return RecommendationPostReadSerializer

    def perform_create(self, serializer):
        portfolio = serializer.validated_data.get("portfolio")

        if portfolio and getattr(portfolio, "editor_id", None) == getattr(self.request.user, "id", None):
            raise ValidationError({"portfolio": ["Você não pode criar recomendação no seu próprio portfólio."]})
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        serializer.save(author=self.get_object().author)


