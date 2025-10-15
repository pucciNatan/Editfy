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
        return Response(PortfolioReadSerializer(portfolio).data, status=200)

    def put(self, request):
        try:
            portfolio = self.get_object(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado para o usuário atual."}, status=404)
        self.check_object_permissions(request, portfolio)
        serializer = PortfolioWriteSerializer(portfolio, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PortfolioReadSerializer(portfolio).data, status=200)
    
    def patch(self, request):
        try:
            portfolio = self.get_object(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado para o usuário atual."}, status=404)
        self.check_object_permissions(request, portfolio)
        serializer = PortfolioWriteSerializer(portfolio, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PortfolioReadSerializer(portfolio).data, status=200)

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

        data = PortfolioReadSerializer(p).data

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
        return Response(ContractorPortfolioReadSerializer(p).data)

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
        return Response(ContractorPortfolioReadSerializer(p).data)

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
        return Response(ContractorPortfolioReadSerializer(p).data)


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

        data = ContractorPortfolioReadSerializer(p).data
        return Response(data, status=200)
