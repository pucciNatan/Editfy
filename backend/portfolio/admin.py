from django.contrib import admin
from .models import Portfolio, ContractorPortfolio


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "editor",
        "language",
        "min_price",
        "max_price",
        "fixed_price",
        "created_at",
        "updated_at",
    )
    list_filter = ("language", "created_at")
    search_fields = (
        "editor__full_name",
        "editor__email",
        "biography",
    )
    raw_id_fields = ("editor", "videos")
    filter_horizontal = ("videos",)

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Dados do editor", {"fields": ("editor",)}),
        ("Conteúdo", {"fields": ("videos", "banner", "biography", "language")}),
        (
            "Preços",
            {
                "fields": (
                    "min_price",
                    "max_price",
                    "fixed_price",
                )
            },
        ),
        ("Taxonomia", {"fields": ("tags", "categories")}),
        ("Metadados", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(ContractorPortfolio)
class ContractorPortfolioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "contractor",
        "language",
        "min_price",
        "max_price",
        "fixed_price",
        "created_at",
        "updated_at",
    )
    list_filter = ("language", "created_at")
    search_fields = (
        "contractor__full_name",
        "contractor__email",
        "biography",
    )
    raw_id_fields = ("contractor",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Dados do contratante", {"fields": ("contractor",)}),
        ("Conteúdo", {"fields": ("banner", "biography", "language")}),
        (
            "Preços",
            {
                "fields": (
                    "min_price",
                    "max_price",
                    "fixed_price",
                )
            },
        ),
        ("Taxonomia", {"fields": ("tags", "categories")}),
        ("Metadados", {"fields": ("created_at", "updated_at")}),
    )
