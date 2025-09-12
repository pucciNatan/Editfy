from django.contrib import admin
from .models import Job, JobApplication


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "contractor", "type", "work_mode", "location",
        "payment_display", "applications_count", "created_at",)
    list_filter = ("type", "work_mode", "created_at")
    search_fields = ("title", "description", "contractor__full_name", "contractor__email")

    def payment_display(self, obj):
        """Mostra faixa ou fixo em formato amigável"""
        if obj.fixed_payment is not None:
            return f"R$ {obj.fixed_payment:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        if obj.min_payment is not None and obj.max_payment is not None:
            min_str = f"R$ {obj.min_payment:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            max_str = f"R$ {obj.max_payment:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            return f"{min_str} - {max_str}"
        return "—"
    payment_display.short_description = "Pagamento"

    def applications_count(self, obj):
        return obj.applications.count()
    applications_count.short_description = "Inscrições"


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "job", "editor", "note", "created_at")
    search_fields = (
        "job__title",
        "job__contractor__full_name",
        "editor__full_name",
        "editor__email"
    )
    list_filter = ("created_at",)
