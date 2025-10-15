from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from jobs.views import JobViewSet
from content.urls import urlpatterns as content_urls
from portfolio.views import PortfolioSelfView, PortfolioVideosView, ContractorPortfolioSelfView, ContractorPortfolioPublicView
from accounts.views import EditorSignupView, ContractorSignupView, MeView, AccountUpdateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import CategoriesView

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

    # Mudar os dados das contas
    path("api/auth/update/", AccountUpdateView.as_view(), name="account-update"),

    # Editor
    path("api/portfolio/", PortfolioSelfView.as_view(), name="portfolio-self"),
    path("api/portfolio/<int:editor_id>/", PortfolioVideosView.as_view(), name="portfolio-public-by-id"),

    # Contractor
    path("api/contractor-portfolio/", ContractorPortfolioSelfView.as_view(), name="contractor-portfolio-self"),
    path("api/contractor-portfolio/<int:contractor_id>/", ContractorPortfolioPublicView.as_view(), name="contractor-portfolio-public-by-id"),

    # content (videos + recommendations)
    path("api/", include((content_urls, "content"), namespace="content")),

    # jobs
    path("api/", include(router.urls)),

    # chat
    path("api/chat/", include("chat.urls")),

    # Puxar as categorias disponíveis
    path("api/meta/categories/", CategoriesView.as_view()),

]
2