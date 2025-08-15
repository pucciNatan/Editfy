from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Account
from portfolio.models import Portfolio

@admin.register(Account)
class AccountAdmin(BaseUserAdmin):
    ordering = ("-account_created_at",)
    list_display = ("id", "full_name", "email", "role", "is_active", "is_staff", "account_created_at")
    search_fields = ("full_name", "email", "nick")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informações pessoais", {"fields": ("full_name", "nick", "phone", "cep", "profile_photo_url", "birth_date", "role")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas importantes", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "full_name", "nick", "phone", "cep", "birth_date", "role"),
        }),
    )

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ("id", "editor", "min_price", "max_price", "fixed_price", "created_at")
    search_fields = ("editor__full_name", "editor__email")
    list_filter = ("created_at", "updated_at")
