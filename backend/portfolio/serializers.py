from decimal import Decimal
from rest_framework import serializers
from .models import Portfolio
from content.serializers import VideoSerializer

def brl(value: Decimal | None) -> str:
    if value is None:
        return ""
    s = f"{value:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"

class PortfolioWriteSerializer(serializers.ModelSerializer):
    editor = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Portfolio
        fields = (
            "id",
            "editor",
            "banner",
            "biography",
            "specialties",
            "language",
            "min_price",
            "max_price",
            "fixed_price",
            "tags",
            "categories",
        )
        read_only_fields = ("id", "editor")

    def validate(self, attrs):
        min_p = attrs.get("min_price") if "min_price" in attrs else getattr(self.instance, "min_price", None)
        max_p = attrs.get("max_price") if "max_price" in attrs else getattr(self.instance, "max_price", None)
        fix_p = attrs.get("fixed_price") if "fixed_price" in attrs else getattr(self.instance, "fixed_price", None)

        # Fixo X Faixa
        if fix_p and (min_p or max_p):
            raise serializers.ValidationError({
                "fixed_price": "Use apenas preço fixo OU faixa de preço (não ambos).",
                "min_price": "Deixe vazio quando o preço fixo for informado.",
                "max_price": "Deixe vazio quando o preço fixo for informado.",
            })

        # Faixa requer ambos
        if (min_p is not None) ^ (max_p is not None):
            raise serializers.ValidationError({
                "min_price": "Informe min_price e max_price para usar uma faixa de preço.",
                "max_price": "Informe min_price e max_price para usar uma faixa de preço.",
            })

        # min <= max
        if min_p is not None and max_p is not None and min_p > max_p:
            raise serializers.ValidationError(
                {"max_price": "O valor máximo deve ser maior ou igual ao valor mínimo."}
            )

        return attrs


class PortfolioReadSerializer(serializers.ModelSerializer):
    editor = serializers.PrimaryKeyRelatedField(read_only=True)
    price_display = serializers.SerializerMethodField()
    videos = VideoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Portfolio
        fields = (
            "id",
            "editor",
            "banner",
            "biography",
            "specialties",
            "language",
            "min_price",
            "max_price",
            "fixed_price",
            "price_display",
            "videos",
            "tags",
            "categories",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_price_display(self, obj: Portfolio) -> str:
        if obj.fixed_price is not None:
            return brl(obj.fixed_price)
        if obj.min_price is not None and obj.max_price is not None:
            return f"{brl(obj.min_price)} - {brl(obj.max_price)}"
        return ""
