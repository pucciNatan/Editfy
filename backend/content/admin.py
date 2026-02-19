# backend/content/admin.py
from django.contrib import admin
from .models import Video, RecommendationPost


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = (
        "title",
        "description",
        "author__full_name",
        "author__email",
    )
    raw_id_fields = ("author",)
    ordering = ("-created_at",)


@admin.register(RecommendationPost)
class RecommendationPostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "portfolio", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = (
        "author__full_name",
        "author__email",
        "portfolio__editor__full_name",
        "portfolio__editor__email",
        "comment",
    )
    raw_id_fields = ("author", "portfolio")
    ordering = ("-created_at",)
