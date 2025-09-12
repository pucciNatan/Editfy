from rest_framework import serializers
from .models import Job, JobApplication
from decimal import Decimal

def brl(value: Decimal | None) -> str:
    """Formata valores em reais (R$ 1.000,00)."""
    if value is None:
        return ""
    s = f"{value:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"

class JobWriteSerializer(serializers.ModelSerializer):
    payment_display = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "contractor", "title", "description",
            "video_example_urls", "video_duration",
            "type", "work_mode", "location",
            "min_payment", "max_payment", "fixed_payment", "payment_display",
            "tags", "categories",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "contractor", "created_at", "updated_at"]

    def validate(self, attrs):
        min_p = attrs.get("min_payment")
        max_p = attrs.get("max_payment")
        fix_p = attrs.get("fixed_payment")

        # não pode ter fixo + faixa
        if fix_p and (min_p or max_p):
            raise serializers.ValidationError({
                "fixed_payment": "Use apenas pagamento fixo OU mínimo/máximo, não ambos.",
                "min_payment": "Deixe vazio se usar pagamento fixo.",
                "max_payment": "Deixe vazio se usar pagamento fixo."
            })

        # faixa precisa dos dois
        if (min_p is not None) ^ (max_p is not None):
            raise serializers.ValidationError({
                "min_payment": "Preencha mínimo e máximo juntos.",
                "max_payment": "Preencha mínimo e máximo juntos."
            })

        # mínimo <= máximo
        if min_p is not None and max_p is not None and min_p > max_p:
            raise serializers.ValidationError({
                "max_payment": "O valor máximo deve ser maior ou igual ao mínimo."
            })

        return attrs

    def get_payment_display(self, obj: Job):
        if obj.fixed_payment is not None:
            return brl(obj.fixed_payment)
        if obj.min_payment is not None and obj.max_payment is not None:
            return f"{brl(obj.min_payment)} - {brl(obj.max_payment)}"
        return ""


class JobReadSerializer(serializers.ModelSerializer):
    contractor = serializers.PrimaryKeyRelatedField(read_only=True)
    applications_count = serializers.IntegerField(read_only=True)
    payment_display = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "contractor", "title", "description",
            "video_example_urls", "video_duration",
            "type", "work_mode", "location",
            "min_payment", "max_payment", "fixed_payment", "payment_display",
            "tags", "categories",
            "applications_count",
            "created_at", "updated_at"
        ]
        read_only_fields = fields

    def get_payment_display(self, obj: Job):
        if obj.fixed_payment is not None:
            return brl(obj.fixed_payment)
        if obj.min_payment is not None and obj.max_payment is not None:
            return f"{brl(obj.min_payment)} - {brl(obj.max_payment)}"
        return ""


class JobApplicationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ("id", "job", "note")
        read_only_fields = ("id",)


class JobApplicationReadSerializer(serializers.ModelSerializer):
    editor = serializers.PrimaryKeyRelatedField(read_only=True)
    job = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = JobApplication
        fields = ("id", "job", "editor", "note", "created_at")
        read_only_fields = fields
