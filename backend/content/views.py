import random
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Video, RecommendationPost
from .serializers import VideoSerializer, RecommendationPostWriteSerializer, RecommendationPostReadSerializer
from .permissions import IsAuthorOrStaff, IsVideoAuthorOrStaff

from rest_framework.permissions import IsAuthenticatedOrReadOnly
from portfolio.models import Portfolio, ContractorPortfolio
from jobs.models import Job
from recsys.recommender import build_contractor_profile, build_editor_profile, combined_score


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().select_related("author").order_by("-id")
    serializer_class = VideoSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsVideoAuthorOrStaff()]
    
    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise PermissionDenied("Autenticação é obrigatória.")

        # (opcional) só EDITOR pode postar vídeo
        if getattr(user, "role", None) != "EDITOR":
            raise PermissionDenied("Apenas editores podem publicar vídeos.")

        # salva o vídeo com o autor correto
        instance = serializer.save(author=user)

        # associa ao portfólio do autor
        try:
            portfolio = Portfolio.objects.get(editor=user)
        except Portfolio.DoesNotExist:
            # se preferir, crie automático, mas normalmente é 404
            raise ValidationError({"portfolio": ["Portfólio do editor não encontrado."]})
        portfolio.videos.add(instance)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        ordering = request.query_params.get("ordering")
        user = request.user if request.user.is_authenticated else None

        if not user or not user.is_authenticated:
            # força random para anônimo, mesmo sem passar o parâmetro
            ordering = "random"

        # --- RANDOM ---
        if ordering == "random":
            items = list(qs)
            random.shuffle(items)
            page = self.paginate_queryset(items)
            if page is not None:
                ser = self.get_serializer(page, many=True)
                return self.get_paginated_response(ser.data)
            ser = self.get_serializer(items, many=True)
            return Response(ser.data)

        # --- RECOMMENDED (DEFAULT) ---
        if user and getattr(user, "role", None) in ("CONTRACTOR", "EDITOR") and (ordering in (None, "", "recommended")):
            # monta perfil do viewer
            if user.role == "CONTRACTOR":
                try:
                    cport = ContractorPortfolio.objects.get(contractor=user)
                except ContractorPortfolio.DoesNotExist:
                    return super().list(request, *args, **kwargs)
                my_jobs = Job.objects.filter(contractor=user).only("id", "tags")
                a_cats, a_tags = build_contractor_profile(cport, my_jobs)
            else:  # EDITOR vendo vídeos
                try:
                    eport = Portfolio.objects.get(editor=user)
                except Portfolio.DoesNotExist:
                    return super().list(request, *args, **kwargs)
                my_videos = Video.objects.filter(author=user).only("id", "tags")
                a_cats, a_tags = build_editor_profile(eport, my_videos)
                # opcional: não listar vídeos do próprio editor
                qs = qs.exclude(author=user)

            # portfolios dos editores (por author_id do vídeo)
            editor_ids = list(qs.values_list("author_id", flat=True).distinct())
            eports = {
                p.editor_id: p
                for p in Portfolio.objects.filter(editor_id__in=editor_ids)
                .only("id", "editor_id", "categories", "tags")
            }

            items = list(qs)
            scored = []
            for v in items:
                eport_item = eports.get(v.author_id)
                b_cats = getattr(eport_item, "categories", []) if eport_item else []
                b_tags = set(v.tags or []) | set(getattr(eport_item, "tags", []) or [])
                score = combined_score(a_cats, a_tags, b_cats, b_tags)
                scored.append((score, v))

            scored.sort(key=lambda x: x[0], reverse=True)
            vids_sorted = [v for _, v in scored]

            page = self.paginate_queryset(vids_sorted)
            if page is not None:
                ser = self.get_serializer(page, many=True)
                return self.get_paginated_response(ser.data)
            ser = self.get_serializer(vids_sorted, many=True)
            return Response(ser.data)

        # fallback padrão
        return super().list(request, *args, **kwargs)


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
