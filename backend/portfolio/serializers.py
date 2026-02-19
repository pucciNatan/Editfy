from decimal import Decimal
from rest_framework import serializers
from .models import Portfolio, ContractorPortfolio
from content.serializers import VideoSerializer
from jobs.serializers import JobReadSerializer
from core.validators import normalize_tags, validate_categories
from core.constants import CATEGORIES_CHOICES
from django.db.models import Count
from django.db.models import Count, OuterRef, Subquery, Exists, Value, IntegerField, BooleanField
from jobs.models import Job, JobApplication
from jobs.serializers import JobReadSerializer


def brl(value: Decimal | None) -> str:
    if value is None:
        return ""
    s = f"{value:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"

class PortfolioWriteSerializer(serializers.ModelSerializer):
    editor = serializers.PrimaryKeyRelatedField(read_only=True)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Portfolio
        fields = (
            "id", "editor", "banner", "biography", "language",
            "min_price", "max_price", "fixed_price",
            "price_display", "videos", "tags", "categories",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_categories(self, value):
        clean = validate_categories(value)
        if not clean:
            return []
        return clean

    def validate_tags(self, value):
        return normalize_tags(value)

    price_display = serializers.SerializerMethodField()
    def get_price_display(self, obj: Portfolio) -> str:
        if obj.fixed_price is not None:
            return brl(obj.fixed_price)
        if obj.min_price is not None and obj.max_price is not None:
            return f"{brl(obj.min_price)} - {brl(obj.max_price)}"
        return ""

class PortfolioReadSerializer(PortfolioWriteSerializer):
    videos = VideoSerializer(many=True, read_only=True)

class ContractorPortfolioWriteSerializer(serializers.ModelSerializer):
    contractor = serializers.PrimaryKeyRelatedField(read_only=True)
    price_display = serializers.SerializerMethodField()
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = ContractorPortfolio
        fields = (
            "id", "contractor", "banner", "biography", "language",
            "min_price", "max_price", "fixed_price",
            "price_display", "tags", "categories",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, data):
        min_p = data.get("min_price")
        max_p = data.get("max_price")
        fixed = data.get("fixed_price")

        if fixed is not None and (min_p is not None or max_p is not None):
            raise serializers.ValidationError("Informe apenas preço fixo OU faixa (mínimo e máximo).")
        if (min_p is None) ^ (max_p is None):
            raise serializers.ValidationError("Para faixa de preços, informe tanto mínimo quanto máximo.")
        if min_p is not None and max_p is not None and min_p > max_p:
            raise serializers.ValidationError("Preço mínimo não pode ser maior que o máximo.")
        return data

    def get_price_display(self, obj: ContractorPortfolio) -> str:
        if obj.fixed_price is not None:
            return brl(obj.fixed_price)
        if obj.min_price is not None and obj.max_price is not None:
            return f"{brl(obj.min_price)} - {brl(obj.max_price)}"
        return ""
    
    def validate_categories(self, value):
        clean = validate_categories(value)
        if not clean:
            return []
        return clean

    def validate_tags(self, value):
        return normalize_tags(value)
    
class ContractorPortfolioReadSerializer(ContractorPortfolioWriteSerializer):
    jobs = serializers.SerializerMethodField()

    class Meta(ContractorPortfolioWriteSerializer.Meta):
        fields = ContractorPortfolioWriteSerializer.Meta.fields + ("jobs",)

    def get_jobs(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        qs = (
            Job.objects
            .filter(contractor=obj.contractor)
            .select_related("contractor")
            .annotate(applications_count=Count("applications", distinct=True))
            .order_by("-id")
        )

        # ✅ replica a lógica do JobViewSet pra editor logado
        if user and user.is_authenticated and getattr(user, "role", None) == "EDITOR":
            app_id_sq = (
                JobApplication.objects
                .filter(job=OuterRef("pk"), editor=user)
                .values("id")[:1]
            )
            qs = qs.annotate(
                my_application_id=Subquery(app_id_sq, output_field=IntegerField()),
                has_applied=Exists(
                    JobApplication.objects.filter(job=OuterRef("pk"), editor=user)
                ),
            )
        else:
            qs = qs.annotate(
                my_application_id=Value(None, output_field=IntegerField()),
                has_applied=Value(False, output_field=BooleanField()),
            )

        # ✅ passa context pra manter consistência
        return JobReadSerializer(qs, many=True, context=self.context).data
