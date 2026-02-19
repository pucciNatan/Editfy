from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsEditorOwner
from .models import Portfolio, ContractorPortfolio
from .serializers import (
    PortfolioWriteSerializer, PortfolioReadSerializer,
    ContractorPortfolioWriteSerializer, ContractorPortfolioReadSerializer,
)
from accounts.models import Account
from content.models import RecommendationPost
from content.serializers import RecommendationPostReadSerializer
from rest_framework.parsers import MultiPartParser, FormParser

from django.core.files.storage import default_storage
import os
import uuid  

# =========================
# EDITOR
# =========================

class PortfolioSelfView(APIView):
    """
    SELF (privado): GET/PUT/PATCH do próprio portfólio do editor autenticado.
    Rota: /api/portfolio/
    """
    permission_classes = [IsEditorOwner]

    def get_object(self, request):
        if getattr(request.user, "is_staff", False):
            editor_id = request.query_params.get("editor")
            if editor_id:
                return Portfolio.objects.select_related("editor").get(editor_id=editor_id)
        return Portfolio.objects.select_related("editor").get(editor=request.user)

    def get(self, request):
        try:
            portfolio = self.get_object(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado para o usuário atual."}, status=404)

        self.check_object_permissions(request, portfolio)

        # ✅ passa request no context
        return Response(
            PortfolioReadSerializer(portfolio, context={"request": request}).data,
            status=200
        )

    def put(self, request):
        try:
            portfolio = self.get_object(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado para o usuário atual."}, status=404)

        self.check_object_permissions(request, portfolio)

        serializer = PortfolioWriteSerializer(portfolio, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ passa request no context
        return Response(
            PortfolioReadSerializer(portfolio, context={"request": request}).data,
            status=200
        )
    
    def patch(self, request):
        try:
            portfolio = self.get_object(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado para o usuário atual."}, status=404)

        self.check_object_permissions(request, portfolio)

        serializer = PortfolioWriteSerializer(portfolio, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ passa request no context
        return Response(
            PortfolioReadSerializer(portfolio, context={"request": request}).data,
            status=200
        )

    def post(self, request):
        return Response({"detail": "Criação via API desabilitada. O portfólio é criado automaticamente."}, status=405)

    def delete(self, request):
        return Response({"detail": "Exclusão via API desabilitada."}, status=405)


class PortfolioVideosView(APIView):
    """
    PÚBLICO: retorna o portfólio do editor por ID (inclui vídeos e recomendações).
    Rota: /api/portfolio/<int:editor_id>/
    """
    permission_classes = [AllowAny]

    def get(self, request, editor_id=None):
        if editor_id is None:
            return Response({"detail": "Informe editor_id."}, status=400)

        try:
            user = Account.objects.get(pk=editor_id, role=Account.Roles.EDITOR)
        except Account.DoesNotExist:
            return Response({"detail": "Editor não encontrado."}, status=404)

        try:
            p = Portfolio.objects.select_related("editor").prefetch_related("videos").get(editor=user)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        # ✅ passa request no context
        data = PortfolioReadSerializer(p, context={"request": request}).data

        rec_qs = RecommendationPost.objects.select_related("author").filter(portfolio=p).order_by("-id")
        data["recommendation_posts"] = RecommendationPostReadSerializer(rec_qs, many=True).data

        return Response(data, status=200)


# =========================
# CONTRATANTE
# =========================

class ContractorPortfolioSelfView(APIView):
    """
    SELF (privado): GET/PUT/PATCH do próprio portfólio do contratante autenticado.
    Rota: /api/contractor-portfolio/
    """
    permission_classes = [IsAuthenticated]

    def get_portfolio(self, request):
        return ContractorPortfolio.objects.get(contractor=request.user)

    def get(self, request):
        try:
            p = self.get_portfolio(request)
        except ContractorPortfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        # ✅ passa request no context (importante pro jobs.has_applied)
        return Response(
            ContractorPortfolioReadSerializer(p, context={"request": request}).data
        )

    def put(self, request):
        try:
            p = self.get_portfolio(request)
        except ContractorPortfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        if not (getattr(request.user, "is_staff", False) or p.contractor_id == request.user.id):
            return Response({"detail": "Sem permissão."}, status=403)

        serializer = ContractorPortfolioWriteSerializer(p, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ passa request no context
        return Response(
            ContractorPortfolioReadSerializer(p, context={"request": request}).data
        )

    def patch(self, request):
        try:
            p = self.get_portfolio(request)
        except ContractorPortfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        if not (getattr(request.user, "is_staff", False) or p.contractor_id == request.user.id):
            return Response({"detail": "Sem permissão."}, status=403)

        serializer = ContractorPortfolioWriteSerializer(p, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ passa request no context
        return Response(
            ContractorPortfolioReadSerializer(p, context={"request": request}).data
        )


class ContractorPortfolioPublicView(APIView):
    """
    PÚBLICO: retorna o portfólio do contratante por ID.
    Rota: /api/contractor-portfolio/<int:contractor_id>/
    """
    permission_classes = [AllowAny]

    def get(self, request, contractor_id=None):
        if contractor_id is None:
            return Response({"detail": "Informe contractor_id."}, status=400)

        try:
            user = Account.objects.get(pk=contractor_id, role=Account.Roles.CONTRACTOR)
        except Account.DoesNotExist:
            return Response({"detail": "Contratante não encontrado."}, status=404)

        try:
            p = ContractorPortfolio.objects.get(contractor=user)
        except ContractorPortfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        # ✅ AQUI era o bug: sem context o serializer não via request.user
        data = ContractorPortfolioReadSerializer(
            p, context={"request": request}
        ).data

        return Response(data, status=200)

class ContractorBannerUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "Nenhum arquivo enviado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            portfolio = ContractorPortfolio.objects.get(contractor=request.user)
        except ContractorPortfolio.DoesNotExist:
            return Response(
                {"detail": "Portfólio não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ext = os.path.splitext(file_obj.name)[1].lower()
        filename = f"banners/{request.user.id}_{uuid.uuid4().hex}{ext}"

        saved_path = default_storage.save(filename, file_obj)
        url = request.build_absolute_uri(default_storage.url(saved_path))

        portfolio.banner = url
        portfolio.save(update_fields=["banner"])

        return Response({"banner": url}, status=status.HTTP_200_OK)

class PortfolioBannerUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "Nenhum arquivo enviado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            portfolio = Portfolio.objects.get(editor=request.user)
        except Portfolio.DoesNotExist:
            return Response(
                {"detail": "Portfólio não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ext = os.path.splitext(file_obj.name)[1].lower()
        filename = f"banners/{request.user.id}_{uuid.uuid4().hex}{ext}"

        saved_path = default_storage.save(filename, file_obj)
        url = request.build_absolute_uri(default_storage.url(saved_path))

        portfolio.banner = url
        portfolio.save(update_fields=["banner"])

        return Response({"banner": url}, status=status.HTTP_200_OK)