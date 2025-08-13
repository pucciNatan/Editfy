from django.urls import path
from accounts.views import EditorSignupView, ContractorSignupView, MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # signup
    path("api/auth/signup/editor/", EditorSignupView.as_view(), name="signup-editor"),
    path("api/auth/signup/contractor/", ContractorSignupView.as_view(), name="signup-contractor"),

    # login (JWT)
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # perfil logado
    path("api/auth/me/", MeView.as_view(), name="me"),
]
