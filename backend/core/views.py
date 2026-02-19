from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .constants import CATEGORIES_CHOICES, MAX_CATEGORIES_PER_PORTFOLIO

class CategoriesView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({
            "choices": CATEGORIES_CHOICES,
            "max_per_portfolio": MAX_CATEGORIES_PER_PORTFOLIO
        })