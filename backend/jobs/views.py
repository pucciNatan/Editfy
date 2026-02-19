import random
from decimal import Decimal, InvalidOperation
from django.db.models import (
    Count, OuterRef, Subquery, Exists,
    Value, IntegerField, BooleanField, Q
)
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Job, JobApplication
from .serializers import (
    JobWriteSerializer, JobReadSerializer,
    JobApplicationWriteSerializer, JobApplicationReadSerializer
)
from .permissions import IsContractorOwnerOrReadOnly

from portfolio.models import Portfolio, ContractorPortfolio
from content.models import Video
from recsys.recommender import (
    build_editor_profile, build_contractor_profile, combined_score
)

from accounts.models import Account

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobReadSerializer

    def get_queryset(self):
        """
        Lista/retrieve com:
        - applications_count
        - has_applied e my_application_id (quando usuário logado é EDITOR)
        - filtros por work_mode, faixa de preço e categorias do contratante
        """
        qs = (
            Job.objects.all()
            .select_related("contractor")
            .annotate(applications_count=Count("applications", distinct=True))
        )

        user = getattr(self.request, "user", None)

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

        # -------------------------------
        # 🔍 FILTROS VIA QUERY PARAMS
        # -------------------------------
        params = self.request.query_params

        # 1) work_mode: remoto / presencial / híbrido
        work_mode_param = params.get("work_mode")
        if work_mode_param:
            raw = work_mode_param.strip().lower()
            wm_map = {
                "remoto": "REMOTE",
                "remote": "REMOTE",
                "presencial": "ON_SITE",
                "presential": "ON_SITE",
                "onsite": "ON_SITE",
                "on_site": "ON_SITE",
                "hibrido": "HYBRID",
                "híbrido": "HYBRID",
                "hybrid": "HYBRID",
            }
            code = wm_map.get(raw, work_mode_param.upper())
            valid_codes = {choice[0] for choice in Job.WORK_MODE_CHOICES}

            if code not in valid_codes:
                raise ValidationError({"work_mode": ["Valor de work_mode inválido."]})

            qs = qs.filter(work_mode=code)

        # helper para decimais
        def parse_decimal(name: str, value: str) -> Decimal:
            try:
                return Decimal(value)
            except (InvalidOperation, TypeError):
                raise ValidationError({name: ["Valor inválido. Use número, ex: 150.00."]})

        # 2) faixa de preço (considerando min_payment / max_payment / fixed_payment)
        min_price_param = params.get("min_price")
        if min_price_param:
            min_price = parse_decimal("min_price", min_price_param)
            qs = qs.filter(
                Q(min_payment__gte=min_price) |
                Q(fixed_payment__gte=min_price)
            )

        max_price_param = params.get("max_price")
        if max_price_param:
            max_price = parse_decimal("max_price", max_price_param)
            qs = qs.filter(
                Q(max_payment__lte=max_price) |
                Q(fixed_payment__lte=max_price)
            )

        # 3) categorias em que o CONTRATANTE trabalha
        #    (vem de ContractorPortfolio.categories)
        categories_param = params.get("categories")
        if categories_param:
            categories = [
                c.strip().lower()
                for c in categories_param.split(",")
                if c.strip()
            ]
            if categories:
                contractor_ids = ContractorPortfolio.objects.filter(
                    categories__overlap=categories
                ).values_list("contractor_id", flat=True)

                qs = qs.filter(contractor_id__in=contractor_ids)

        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]

        if self.action in ("apply", "delete_application", "list_applications", "my_applied"):
            return [permissions.IsAuthenticated()]

        return [IsContractorOwnerOrReadOnly()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return JobWriteSerializer
        return JobReadSerializer

    # ✅ garante contractor_id nunca nulo e bloqueia editor criando vaga
    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)

        if not user or not user.is_authenticated:
            raise PermissionDenied("Você precisa estar logado para criar uma vaga.")

        if getattr(user, "role", None) != Account.Roles.CONTRACTOR and not getattr(user, "is_staff", False):
            raise PermissionDenied("Apenas contratantes podem criar vagas.")

        serializer.save(contractor=user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        ordering = request.query_params.get("ordering")
        user = request.user if request.user.is_authenticated else None

        if not user or not user.is_authenticated:
            ordering = "random"

        # --- RANDOM ---
        if ordering == "random":
            items = list(qs)
            random.shuffle(items)
            page = self.paginate_queryset(items)
            if page is not None:
                ser = self.get_serializer(page, many=True)
                return self.get_paginated_response(ser.data)
            ser = self.get_serializer(items, many=True)
            return Response(ser.data)

        # --- RECOMMENDED (DEFAULT) ---
        if user and getattr(user, "role", None) in ("EDITOR", "CONTRACTOR") and (ordering in (None, "", "recommended")):
            if user.role == "EDITOR":
                try:
                    editor_port = Portfolio.objects.get(editor=user)
                except Portfolio.DoesNotExist:
                    return super().list(request, *args, **kwargs)

                editor_videos = Video.objects.filter(author=user).only("id", "tags")
                a_cats, a_tags = build_editor_profile(editor_port, editor_videos)

            else:  # CONTRATANTE vendo vagas
                try:
                    cport = ContractorPortfolio.objects.get(contractor=user)
                except ContractorPortfolio.DoesNotExist:
                    return super().list(request, *args, **kwargs)

                # ✅ assinatura nova exige jobs_qs
                contractor_jobs_qs = Job.objects.filter(contractor=user).only("id", "tags")
                a_cats, a_tags = build_contractor_profile(cport, contractor_jobs_qs)

            # perfis de contratantes
            contractor_ids = list(qs.values_list("contractor_id", flat=True))
            cports_qs = ContractorPortfolio.objects.filter(contractor_id__in=contractor_ids).only(
                "contractor_id", "categories", "tags"
            )
            cports = {c.contractor_id: c for c in cports_qs}

            items = list(qs)
            scored = []
            for job in items:
                cport_item = cports.get(job.contractor_id)
                b_cats = getattr(cport_item, "categories", []) if cport_item else []
                b_tags = set(job.tags or []) | set(getattr(cport_item, "tags", []) or [])
                score = combined_score(a_cats, a_tags, b_cats, b_tags)
                scored.append((score, job))

            scored.sort(key=lambda x: x[0], reverse=True)
            jobs_sorted = [j for _, j in scored]

            page = self.paginate_queryset(jobs_sorted)
            if page is not None:
                ser = self.get_serializer(page, many=True)
                return self.get_paginated_response(ser.data)

            ser = self.get_serializer(jobs_sorted, many=True)
            return Response(ser.data)

        # --- DEFAULT ---
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["get"], url_path="applications",
            permission_classes=[permissions.IsAuthenticated])
    def list_applications(self, request, pk=None):
        job = self.get_object()
        if not (request.user.is_staff or job.contractor_id == request.user.id):
            return Response({"detail": "Sem permissão."}, status=403)
        qs = JobApplication.objects.filter(job=job).select_related("editor")
        data = JobApplicationReadSerializer(qs, many=True).data
        return Response(data, status=200)

    @action(detail=True, methods=["post"], url_path="apply",
            permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        job = self.get_object()
        user = request.user

        if getattr(user, "role", None) != "EDITOR" and not user.is_staff:
            raise ValidationError("Apenas editores podem se candidatar.")

        if JobApplication.objects.filter(job=job, editor=user).exists():
            raise ValidationError("Você já se candidatou a esta vaga.")

        serializer = JobApplicationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        app = serializer.save(job=job, editor=user)

        data = JobApplicationReadSerializer(app).data
        return Response(data, status=201)

    @action(detail=True, methods=["delete"], url_path=r"applications/(?P<app_id>\d+)",
            permission_classes=[permissions.IsAuthenticated])
    def delete_application(self, request, pk=None, app_id=None):
        job = self.get_object()
        try:
            app = JobApplication.objects.get(pk=app_id, job=job)
        except JobApplication.DoesNotExist:
            return Response({"detail": "Inscrição não encontrada."}, status=404)

        user = request.user
        if user.is_staff or app.editor_id == user.id or job.contractor_id == user.id:
            app.delete()
            return Response(status=204)
        return Response({"detail": "Sem permissão."}, status=403)

    @action(detail=False, methods=["get"], url_path="my-applied",
            permission_classes=[permissions.IsAuthenticated])
    def my_applied(self, request):
        """
        Retorna as vagas em que o editor logado já se candidatou.
        """
        user = request.user
        if getattr(user, "role", None) != "EDITOR" and not getattr(user, "is_staff", False):
            return Response({"detail": "Apenas editores podem acessar."}, status=403)

        qs = self.get_queryset().filter(applications__editor=user).distinct()

        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)

        ser = self.get_serializer(qs, many=True)
        return Response(ser.data, status=200)
