from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Account
from portfolio.models import Portfolio, ContractorPortfolio

@receiver(post_save, sender=Account)
def create_portfolio_for_editor(sender, instance: Account, created, **kwargs):
    # EDITOR
    if (created and instance.role == "EDITOR") or (not created and instance.role == "EDITOR" and not hasattr(instance, "portfolio")):
        Portfolio.objects.get_or_create(editor=instance)

    # CONTRATANTE
    if (created and instance.role == "CONTRACTOR") or (not created and instance.role == "CONTRACTOR" and not hasattr(instance, "contractor_portfolio")):
        ContractorPortfolio.objects.get_or_create(contractor=instance)

    
