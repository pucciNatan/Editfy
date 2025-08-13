from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Account

@admin.register(Account)
class AccountAdmin(BaseUserAdmin):
    ordering = ("-account_created_at",)
    list_display = ("id", "full_name", "email", "role", "is_active", "is_staff", "account_created_at")
    search_fields = ("full_name", "email", "nick")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "nick", "phone", "cep", "profile_photo_url", "birth_date", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "full_name", "nick", "phone", "cep", "birth_date", "role"),
        }),
    )
