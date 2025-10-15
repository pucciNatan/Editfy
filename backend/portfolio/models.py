from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.conf import settings
from django.contrib.postgres.fields import ArrayField


class Portfolio(models.Model):
    editor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio",
        verbose_name="Editor"
    )

    videos = models.ManyToManyField(
        "content.Video",
        related_name="portfolios",
        blank=True
    )

    banner = models.URLField(blank=True, default='')
    biography = models.TextField(blank=True, default='')
    language = models.CharField(max_length=60, blank=True, default='')

    min_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        null=True, blank=True,
        verbose_name="Preço mínimo"
    )
    max_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        null=True, blank=True,
        verbose_name="Preço máximo"
    )
    fixed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        null=True, blank=True,
        verbose_name="Preço fixo"
    )
    description = models.TextField(
        null=True, blank=True,
        verbose_name="Descrição"
    )

    tags = ArrayField(models.CharField(max_length=32), default=list, blank=True)
    categories = ArrayField(models.CharField(max_length=32), default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Portfólio"
        verbose_name_plural = "Portfólios"

    def __str__(self):
        return f"Portfólio de {self.editor.full_name}"

class ContractorPortfolio(models.Model):
    contractor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contractor_portfolio",
        verbose_name="Contractor"
    )

    banner = models.URLField(blank=True, default="", verbose_name="Banner")
    biography = models.TextField(blank=True, default="", verbose_name="Biografia")
    language = models.CharField(max_length=16, default="pt-BR", verbose_name="Idioma")

    min_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Preço mínimo"
    )
    max_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Preço máximo"
    )
    fixed_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Preço fixo"
    )

    tags = ArrayField(models.CharField(max_length=32), default=list, blank=True)
    categories = ArrayField(models.CharField(max_length=32), default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Portfólio de Contratante"
        verbose_name_plural = "Portfólios de Contratante"

    def __str__(self):
        return f"Portfólio do contratante {self.contractor.full_name}"