from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField


class Video(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="videos_authored",
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    tags = ArrayField(models.CharField(max_length=32), default=list, blank=True)
    categories = ArrayField(models.CharField(max_length=32), default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-id",)
        verbose_name = "Vídeo"
        verbose_name_plural = "Vídeos"

    def __str__(self):
        return self.title


class RecommendationPost(models.Model):
    portfolio = models.ForeignKey(
        "portfolio.Portfolio",
        on_delete=models.CASCADE,
        related_name="recommendation_posts"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendation_posts"
    )
    comment = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-id",)
        verbose_name = "Post de recomendação"
        verbose_name_plural = "Posts de recomendação"

    def __str__(self):
        return f"Recomendação de {self.author} para Portfolio {self.portfolio_id}"
