from rest_framework.routers import DefaultRouter
from .views import VideoViewSet, RecommendationPostViewSet

router = DefaultRouter()
router.register(r'videos', VideoViewSet, basename='videos')
router.register(r'recommendations', RecommendationPostViewSet, basename='recommendations')

urlpatterns = router.urls
