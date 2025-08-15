from rest_framework import serializers
from .models import Video, RecommendationPost

class VideoSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)  

    class Meta:
        model = Video
        fields = ["id", "author", "title", "description", "tags", "categories", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

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
