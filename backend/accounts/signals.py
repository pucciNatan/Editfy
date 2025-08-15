from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Account
from portfolio.models import Portfolio

@receiver(post_save, sender=Account)
def create_portfolio_for_editor(sender, instance: Account, created, **kwargs):
    if created and instance.role == "EDITOR":
        Portfolio.objects.get_or_create(editor=instance)

    if not created and instance.role == "EDITOR" and not hasattr(instance, "portfolio"):
        Portfolio.objects.get_or_create(editor=instance)
