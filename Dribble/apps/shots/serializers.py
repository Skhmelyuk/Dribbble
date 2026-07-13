from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Shot, Tag, Comment
from apps.users.serializers import UserProfileSerializer

User = get_user_model()

class ShotAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar')

class TagRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        return value.name

    def to_internal_value(self, data):
        tag_name = data.strip().lower()
        if not tag_name:
            raise serializers.ValidationError("Назва тегу не може бути порожньою.")
        tag, created = Tag.objects.get_or_create(name=tag_name)
        return tag


class CommentAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar')


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(source='user', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'text', 'created_at')
        read_only_fields = ('id', 'author', 'created_at')


class ShotSerializer(serializers.ModelSerializer):
    author = ShotAuthorSerializer(read_only=True)
    tags = TagRelatedField(many=True, queryset=Tag.objects.all(), required=False)

    # Поля соціальної взаємодії
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Shot
        fields = (
            'id', 'title', 'description', 'image', 'preview',
            'tags', 'author', 'likes_count', 'comments_count',
            'is_liked', 'is_saved', 'created_at'
        )
        read_only_fields = ('id', 'preview', 'author', 'created_at')

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False

    def to_internal_value(self, data):
        if 'tags' in data and isinstance(data['tags'], str):
            tags_list = [t.strip() for t in data['tags'].split(',') if t.strip()]

            if hasattr(data, 'lists'):
                from django.http import QueryDict
                mutable_data = QueryDict('', mutable=True)
                for key, values in data.lists():
                    mutable_data.setlist(key, values)
                mutable_data.setlist('tags', tags_list)
                data = mutable_data
            elif hasattr(data, 'copy'):
                mutable_data = data.copy()
                mutable_data['tags'] = tags_list
                data = mutable_data
            else:
                data = {**data, 'tags': tags_list}

        return super().to_internal_value(data)