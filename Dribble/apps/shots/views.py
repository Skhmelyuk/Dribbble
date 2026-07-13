from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from django.core.cache import cache
from .models import Shot, Like, Save, Comment
from .serializers import ShotSerializer, CommentSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class ShotsPagination(LimitOffsetPagination):
    default_limit = 12
    max_limit = 50


class ShotViewSet(viewsets.ModelViewSet):
    queryset = Shot.objects.all().select_related('author').prefetch_related('tags', 'likes', 'saves', 'comments')
    serializer_class = ShotSerializer
    pagination_class = ShotsPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    # Фільтрація та Пошук
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        """GET /api/shots/ — список robít із кешуванням на 5 хвилин"""
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()

        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        tags_param = self.request.query_params.get('tags')
        if tags_param:
            tags_list = [t.strip().lower() for t in tags_param.split(',') if t.strip()]
            for tag_name in tags_list:
                queryset = queryset.filter(tags__name=tag_name)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """POST /api/shots/:id/like/ — toggle like"""
        shot = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, shot=shot)
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': shot.likes.count()})
        return Response({'liked': True, 'likes_count': shot.likes.count()}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        """POST /api/shots/:id/save/ — toggle save"""
        shot = self.get_object()
        save_obj, created = Save.objects.get_or_create(user=request.user, shot=shot)
        if not created:
            save_obj.delete()
            return Response({'saved': False})
        return Response({'saved': True}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """
        GET  /api/shots/:id/comments/ — список коментарів
        POST /api/shots/:id/comments/ — додати коментар
        """
        shot = self.get_object()

        if request.method == 'GET':
            comments = shot.comments.select_related('user').all()
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, shot=shot)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['delete'],
        url_path='comments/(?P<comment_id>[^/.]+)',
        permission_classes=[permissions.IsAuthenticated]
    )
    def delete_comment(self, request, pk=None, comment_id=None):
        """DELETE /api/shots/:id/comments/:comment_id/"""
        comment = get_object_or_404(Comment, id=comment_id, shot=self.get_object())
        if comment.user != request.user:
            return Response({'detail': 'Можна видаляти тільки свої коментарі.'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
