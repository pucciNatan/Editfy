from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.contrib.postgres.fields import ArrayField
from decimal import Decimal

class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ("FIXED", "Fixo"),
        ("FREELANCE", "Freelance"),
    ]

    WORK_MODE_CHOICES = [
        ("REMOTE", "Remoto"),
        ("ON_SITE", "Presencial"),
        ("HYBRID", "Híbrido"),
    ]

    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jobs",
        verbose_name="Contratante"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    video_example_urls = models.JSONField(default=list, blank=True)
    video_duration = models.CharField(max_length=60, blank=True, default="")

    type = models.CharField(max_length=15, choices=JOB_TYPE_CHOICES)
    work_mode = models.CharField(max_length=15, choices=WORK_MODE_CHOICES)
    location = models.CharField(max_length=255, blank=True, default="")

    min_payment = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        null=True, blank=True, verbose_name="Pagamento mínimo"
    )
    max_payment = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        null=True, blank=True, verbose_name="Pagamento máximo"
    )
    fixed_payment = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        null=True, blank=True, verbose_name="Pagamento fixo"
    )

    tags = ArrayField(models.CharField(max_length=32), default=list, blank=True)
    categories = ArrayField(models.CharField(max_length=32), default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]
        verbose_name = "Vaga"
        verbose_name_plural = "Vagas"

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")
    note = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("job", "editor"),)  # um editor só se inscreve 1x em uma vaga
        ordering = ("-id",)
        verbose_name = "Inscrição na vaga"
        verbose_name_plural = "Inscrições na vaga"

    def __str__(self):
        return f"Job {self.job_id} - Editor {self.editor_id}"
