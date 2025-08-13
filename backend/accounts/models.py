from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class AccountManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Informe um e-mail.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuário precisa ter is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusuário precisa ter is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Account(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        EDITOR = "EDITOR", "Editor"
        CONTRACTOR = "CONTRACTOR", "Contractor"

    id = models.BigAutoField(primary_key=True)

    nick = models.CharField(
        max_length=50,
        db_index=True,
        error_messages={
            "blank": "Informe o apelido.",
            "max_length": "Apelido deve ter no máximo 50 caracteres."
        },
    )

    full_name = models.CharField(
        max_length=150,
        error_messages={"blank": "Informe o nome completo."},
    )

    email = models.EmailField(
        unique=True,
        error_messages={
            "unique": "Já existe um usuário com este e-mail.",
            "invalid": "Informe um e-mail válido."
        },
    )

    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(
            regex=r"^\+?\d{10,14}$",
            message="Informe um telefone válido (somente números, com DDD; ex.: 85999998888)."
        )],
        error_messages={"blank": "Informe o telefone."},
    )

    cep = models.CharField(
        max_length=9,
        validators=[RegexValidator(
            regex=r"^\d{5}-?\d{3}$",
            message="Informe um CEP válido no formato 00000-000."
        )],
        error_messages={"blank": "Informe o CEP."},
    )

    profile_photo_url = models.URLField(
        blank=True, null=True,
        error_messages={"invalid": "Informe uma URL válida para a foto de perfil."},
    )

    account_created_at = models.DateTimeField(auto_now_add=True)

    birth_date = models.DateField(
        error_messages={"invalid": "Informe uma data de nascimento válida (AAAA-MM-DD)."}
    )

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        error_messages={"blank": "Informe o tipo de usuário (Editor ou Contractor)."},
    )

    # campos obrigatórios de auth
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = AccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "nick", "phone", "cep", "birth_date", "role"]

    class Meta:
        db_table = "accounts_account"
        ordering = ["-account_created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.role})"


# -------- Proxies para segmentar por papel --------
class EditorManager(AccountManager):
    def get_queryset(self):
        return super().get_queryset().filter(role=Account.Roles.EDITOR)


class ContractorManager(AccountManager):
    def get_queryset(self):
        return super().get_queryset().filter(role=Account.Roles.CONTRACTOR)


class Editor(Account):
    objects = EditorManager()

    class Meta:
        proxy = True
        verbose_name = "Editor"
        verbose_name_plural = "Editors"


class Contractor(Account):
    objects = ContractorManager()

    class Meta:
        proxy = True
        verbose_name = "Contractor"
        verbose_name_plural = "Contractors"
