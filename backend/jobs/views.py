from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import Job, JobApplication
from .serializers import (
    JobWriteSerializer, JobReadSerializer,
    JobApplicationWriteSerializer, JobApplicationReadSerializer
)
from .permissions import IsContractorOwnerOrReadOnly
from rest_framework.exceptions import ValidationError

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().annotate(applications_count=Count("applications"))
    permission_classes = [IsContractorOwnerOrReadOnly]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return JobWriteSerializer
        return JobReadSerializer

    def perform_create(self, serializer):
        user = self.request.user
        # só CONTRATANTE cria vaga (ou staff)
        if getattr(user, "role", None) != "CONTRACTOR" and not getattr(user, "is_staff", False):
            raise ValidationError({"detail": "Apenas contas com papel de CONTRATANTE podem criar vagas."})
        serializer.save(contractor=user)

    @action(detail=True, methods=["get"], url_path="applications",
            permission_classes=[permissions.IsAuthenticated])
    def list_applications(self, request, pk=None):
        #Somente o DONO da vaga (ou staff) vê os candidatos
        job = self.get_object()
        self.check_object_permissions(request, job)
        if not (request.user.is_staff or job.contractor_id == request.user.id):
            return Response({"detail": "Sem permissão."}, status=403)

        qs = JobApplication.objects.filter(job=job).select_related("editor")
        data = JobApplicationReadSerializer(qs, many=True).data
        return Response(data, status=200)

    @action(detail=True, methods=["post"], url_path="apply",
            permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        # Apenas editores podem se candidatar
        # Contratantes NÃO podem se candidatar
        # Impede duplicidade (unique_together no model)
        job = self.get_object()
        user = request.user

        if getattr(user, "role", None) != "EDITOR":
            return Response({"detail": "Somente editores podem se candidatar."}, status=403)
        if job.contractor_id == user.id:
            return Response({"detail": "Você é o contratante desta vaga."}, status=400)

        payload = {"job": job.id, "note": request.data.get("note", "").strip()}
        ser = JobApplicationWriteSerializer(data=payload)
        ser.is_valid(raise_exception=True)

        # garante unicidade
        if JobApplication.objects.filter(job=job, editor=user).exists():
            return Response({"detail": "Você já se candidatou a esta vaga."}, status=400)

        app = JobApplication.objects.create(job=job, editor=user, note=ser.validated_data.get("note", ""))
        return Response(JobApplicationReadSerializer(app).data, status=201)

    @action(detail=True, methods=["delete"], url_path="applications/(?P<app_id>\\d+)",
            permission_classes=[permissions.IsAuthenticated])
    def delete_application(self, request, pk=None, app_id=None):
        # Editor remove SUA inscrição (desistir)
        # Contratante dono da vaga pode remover qualquer inscrição (rejeitar)
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
