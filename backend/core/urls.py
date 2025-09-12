from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from jobs.views import JobViewSet
from content.urls import urlpatterns as content_urls
from portfolio.views import PortfolioSelfView, PortfolioVideosView
from accounts.views import EditorSignupView, ContractorSignupView, MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r"jobs", JobViewSet, basename="jobs")

urlpatterns = [
    path("admin/", admin.site.urls),

    # auth
    path("api/auth/signup/editor/", EditorSignupView.as_view()),
    path("api/auth/signup/contractor/", ContractorSignupView.as_view()),
    path("api/auth/login/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", MeView.as_view()),

    # portfolio
    path("api/portfolio/", PortfolioSelfView.as_view()),
    path("api/portfolio/videos/", PortfolioVideosView.as_view()),
    path("api/portfolio/videos/<int:video_id>/", PortfolioVideosView.as_view()),

    # content (videos + recommendations)
    path("api/", include((content_urls, "content"), namespace="content")),

    # jobs
    path("api/", include(router.urls)),
]
2