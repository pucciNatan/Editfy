from rest_framework import serializers
from .models import Account

class BaseSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Account
        fields = [
            "id", "nick", "full_name", "email", "phone", "cep",
            "profile_photo_url", "birth_date", "password",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        # role será setado pelos filhos
        password = validated_data.pop("password")
        user = Account.objects.create_user(password=password, **validated_data)
        return user


class EditorSignupSerializer(BaseSignupSerializer):
    def create(self, validated_data):
        validated_data["role"] = Account.Roles.EDITOR
        return super().create(validated_data)


class ContractorSignupSerializer(BaseSignupSerializer):
    def create(self, validated_data):
        validated_data["role"] = Account.Roles.CONTRACTOR
        return super().create(validated_data)


class AccountMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            "id", "role", "nick", "full_name", "email", "phone", "cep",
            "profile_photo_url", "account_created_at", "birth_date", "is_active"
        ]
        read_only_fields = fields
