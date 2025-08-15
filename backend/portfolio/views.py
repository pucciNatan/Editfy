from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsEditorOwner
from rest_framework.permissions import AllowAny
from .models import Portfolio
from rest_framework.permissions import IsAuthenticated
from .serializers import PortfolioWriteSerializer, PortfolioReadSerializer
from content.models import Video
from content.models import RecommendationPost
from content.serializers import RecommendationPostReadSerializer, VideoSerializer

class PortfolioPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, editor_id=None, nick=None):
        try:
            if editor_id is not None:
                p = Portfolio.objects.select_related("editor").prefetch_related("videos").get(editor_id=editor_id)
            else:
                p = Portfolio.objects.select_related("editor").prefetch_related("videos").get(editor__nick=nick)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        data = PortfolioReadSerializer(p).data

        rec_qs = RecommendationPost.objects.select_related("author").filter(portfolio=p).order_by("-id")
        data["recommendation_posts"] = RecommendationPostReadSerializer(rec_qs, many=True).data

        return Response(data, status=200)
    
class PortfolioSelfView(APIView):
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
    permission_classes = [IsAuthenticated]

    def get_portfolio(self, request):
        return Portfolio.objects.get(editor=request.user)

    def get(self, request):
        try:
            p = self.get_portfolio(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)
        videos = p.videos.all().order_by("-id")
        return Response(VideoSerializer(videos, many=True).data, status=200)

    def post(self, request):
        return Response({"detail": "Operação não permitida. Vídeos são adicionados automaticamente ao criar."},
                        status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def delete(self, request, video_id=None):
        try:
            p = self.get_portfolio(request)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfólio não encontrado."}, status=404)

        if not (getattr(request.user, "is_staff", False) or p.editor_id == request.user.id):
            return Response({"detail": "Sem permissão."}, status=403)

        try:
            video = Video.objects.get(pk=video_id)
        except Video.DoesNotExist:
            return Response({"detail": "Vídeo não encontrado."}, status=404)

        p.videos.remove(video)
        return Response(status=204)