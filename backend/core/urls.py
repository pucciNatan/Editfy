from django.urls import path, include
from accounts.views import EditorSignupView, ContractorSignupView, MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from portfolio.views import PortfolioSelfView, PortfolioVideosView, PortfolioPublicView
from content.urls import urlpatterns as content_urls
from django.contrib import admin

urlpatterns = [
    #ADM
    path("admin/", admin.site.urls),

    # auth
    path("api/auth/signup/editor/", EditorSignupView.as_view(), name="signup-editor"),
    path("api/auth/signup/contractor/", ContractorSignupView.as_view(), name="signup-contractor"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),

    # público: portfólios por id ou nick (sem login)
    path("api/public/portfolios/<int:editor_id>/", PortfolioPublicView.as_view(), name="portfolio-public-by-id"),
    path("api/public/portfolios/by-nick/<str:nick>/", PortfolioPublicView.as_view(), name="portfolio-public-by-nick"),

    # portfolio singleton (editor logado edita o seu)
    path("api/portfolio/", PortfolioSelfView.as_view(), name="portfolio-self"),

    # vídeos do meu portfólio
    path("api/portfolio/videos/", PortfolioVideosView.as_view(), name="portfolio-videos-list-add"),
    path("api/portfolio/videos/<int:video_id>/", PortfolioVideosView.as_view(), name="portfolio-videos-remove"),

    # content (videos + recommendations)
    path("api/", include((content_urls, "content"), namespace="content")),
]
