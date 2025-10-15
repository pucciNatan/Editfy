import random
from django.db.models import Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Job, JobApplication
from .serializers import JobWriteSerializer, JobReadSerializer, JobApplicationWriteSerializer, JobApplicationReadSerializer
from .permissions import IsContractorOwnerOrReadOnly

from rest_framework.permissions import IsAuthenticatedOrReadOnly
from portfolio.models import ContractorPortfolio, Portfolio
from content.models import Video
from recsys.recommender import build_editor_profile, build_contractor_profile, combined_score


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().select_related("contractor").annotate(applications_count=Count("applications"))
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsContractorOwnerOrReadOnly()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return JobWriteSerializer
        return JobReadSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        ordering = request.query_params.get("ordering")
        user = request.user if request.user.is_authenticated else None

        if not user or not user.is_authenticated:
            # força random para anônimo, mesmo sem passar o parâmetro
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
            else:  # CONTRATANTE vendo vagas (cruzado)
                try:
                    cport = ContractorPortfolio.objects.get(contractor=user)
                except ContractorPortfolio.DoesNotExist:
                    return super().list(request, *args, **kwargs)
                my_jobs = Job.objects.filter(contractor=user).only("id", "tags")
                a_cats, a_tags = build_contractor_profile(cport, my_jobs)
                # opcional: não listar as PRÓPRIAS vagas do contratante
                qs = qs.exclude(contractor=user)

            contractor_ids = list(qs.values_list("contractor_id", flat=True).distinct())
            cports = {
                p.contractor_id: p
                for p in ContractorPortfolio.objects.filter(contractor_id__in=contractor_ids)
                .only("id", "contractor_id", "categories", "tags")
            }

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

        # fallback padrão
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role", None) != "CONTRACTOR" and not getattr(user, "is_staff", False):
            raise ValidationError({"detail": "Apenas contas com papel de CONTRATANTE podem criar vagas."})
        serializer.save(contractor=user)

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
        if getattr(user, "role", None) != "EDITOR":
            return Response({"detail": "Somente editores podem se candidatar."}, status=403)
        if job.contractor_id == user.id:
            return Response({"detail": "Você é o contratante desta vaga."}, status=400)

        payload = {"job": job.id, "note": request.data.get("note", "").strip()}
        ser = JobApplicationWriteSerializer(data=payload)
        ser.is_valid(raise_exception=True)

        if JobApplication.objects.filter(job=job, editor=user).exists():
            return Response({"detail": "Você já se candidatou a esta vaga."}, status=400)

        app = JobApplication.objects.create(job=job, editor=user, note=ser.validated_data.get("note", ""))
        return Response(JobApplicationReadSerializer(app).data, status=201)

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
