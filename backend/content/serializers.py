from rest_framework import serializers
from .models import Video, RecommendationPost
from core.validators import normalize_tags

class VideoSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)  
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Video
        fields = ["id", "author", "title", "url", "description", "tags", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_url(self, value):
        if "youtube.com" not in value:
            raise serializers.ValidationError("A URL deve ser um link válido do YouTube.")
        return value
    
    def validate_tags(self, value):
        return normalize_tags(value)
    
class RecommendationPostWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationPost
        fields = ["id", "portfolio", "comment"]
        read_only_fields = ["id"]

class RecommendationPostReadSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RecommendationPost
        fields = ["id", "portfolio", "author", "comment", "created_at", "updated_at"]
        read_only_fields = ["id", "portfolio", "author", "created_at", "updated_at"]
