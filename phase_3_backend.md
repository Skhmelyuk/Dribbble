# Фаза 3: Соціальні Взаємодії (Бекенд)

> Стек: Django REST Framework  
> Передумова: Фаза 1 та Фаза 2 повністю реалізовані та протестовані.

---

## Що реалізується у цій фазі

| Функціонал | Endpoint |
|---|---|
| Like / Unlike shot | `POST /api/shots/:id/like/` |
| Save / Unsave shot | `POST /api/shots/:id/save/` |
| Follow / Unfollow user | `POST /api/users/:username/follow/` |
| Список коментарів | `GET /api/shots/:id/comments/` |
| Додати коментар | `POST /api/shots/:id/comments/` |
| Видалити коментар | `DELETE /api/shots/:id/comments/:comment_id/` |
| Liked shots користувача | `GET /api/users/:username/liked/` |
| Підписники / Підписки | `GET /api/users/:username/followers/` |
| | `GET /api/users/:username/following/` |

---

## 1. Моделі (`apps/shots/models.py` — оновлення)

Додаємо `Like`, `Save`, `Comment` в існуючий файл моделей.

```python
from django.db import models
from django.conf import settings


class Like(models.Model):
    """Лайк до Shot. Один юзер — один лайк на один Shot."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    shot = models.ForeignKey('Shot', on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'shot')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked {self.shot.title}"


class Save(models.Model):
    """Збережений Shot. Один юзер — один Save на один Shot."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saves')
    shot = models.ForeignKey('Shot', on_delete=models.CASCADE, related_name='saves')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'shot')
        ordering = ['-created_at']


class Comment(models.Model):
    """Коментар до Shot."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    shot = models.ForeignKey('Shot', on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.shot.title}"
```

---

## 2. Модель Follow (`apps/users/models.py` — оновлення)

```python
class Follow(models.Model):
    """Підписка одного юзера на іншого."""
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following_set'  # юзери, на яких підписаний
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers_set'  # юзери, які підписані на цього
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.follower == self.followed:
            raise ValidationError("Не можна підписатися на самого себе.")
```

```bash
python manage.py makemigrations shots users
python manage.py migrate
```

---

## 3. Оновлення `ShotSerializer` — реальні дані замість заглушок

```python
# apps/shots/serializers.py — оновити методи

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
```

> **Важливо:** `ShotViewSet` та `ShotDetailView` мають передавати `context={'request': request}` в серіалізатор. DRF робить це автоматично у ViewSet.

---

## 4. Оновлення `PublicUserProfileSerializer` — реальні підписники

```python
# apps/users/serializers.py — оновити методи

def get_followers_count(self, obj):
    return obj.followers_set.count()

def get_following_count(self, obj):
    return obj.following_set.count()

def get_is_following(self, obj):
    request = self.context.get('request')
    if request and request.user.is_authenticated:
        return obj.followers_set.filter(follower=request.user).exists()
    return False
```

---

## 5. Серіалізатори для коментарів та підписок (`apps/shots/serializers.py`)

```python
from .models import Like, Save, Comment

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
```

```python
# apps/users/serializers.py
class FollowUserSerializer(serializers.ModelSerializer):
    """Мінімальний профіль для списків followers/following."""
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar', 'bio')
```

---

## 6. Views для взаємодій (`apps/shots/views.py` — додати)

```python
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Like, Save, Comment
from .serializers import CommentSerializer


class ShotViewSet(viewsets.ModelViewSet):
    # ... існуючий код ...

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
```

---

## 7. Views для Follow та Liked (`apps/users/views.py` — додати)

```python
from .models import Follow, User
from apps.shots.models import Shot
from apps.shots.serializers import ShotSerializer
from .serializers import FollowUserSerializer, PublicUserProfileSerializer


class FollowToggleView(APIView):
    """POST /api/users/:username/follow/ — toggle follow"""
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({'detail': 'Не можна підписатися на самого себе.'}, status=400)

        follow, created = Follow.objects.get_or_create(follower=request.user, followed=target)
        if not created:
            follow.delete()
            return Response({'following': False, 'followers_count': target.followers_set.count()})
        return Response({'following': True, 'followers_count': target.followers_set.count()}, status=201)


class LikedShotsView(generics.ListAPIView):
    """GET /api/users/:username/liked/ — лайкнуті shots юзера"""
    serializer_class = ShotSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        liked_ids = user.likes.values_list('shot_id', flat=True)
        return Shot.objects.filter(id__in=liked_ids).select_related('author').prefetch_related('tags')


class FollowersListView(generics.ListAPIView):
    """GET /api/users/:username/followers/ — підписники"""
    serializer_class = FollowUserSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Вимикаємо пагінацію, щоб повернути масив

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        return User.objects.filter(following_set__followed=user)


class FollowingListView(generics.ListAPIView):
    """GET /api/users/:username/following/ — підписки"""
    serializer_class = FollowUserSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Вимикаємо пагінацію, щоб повернути масив

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        return User.objects.filter(followers_set__follower=user)
```

---

## 8. Оновлені маршрути

### `apps/users/public_urls.py` (оновлення)
```python
from django.urls import path
from .views import PublicUserProfileView, FollowToggleView, LikedShotsView, FollowersListView, FollowingListView

urlpatterns = [
    path('<str:username>/', PublicUserProfileView.as_view(), name='public_user_profile'),
    path('<str:username>/follow/', FollowToggleView.as_view(), name='follow_toggle'),
    path('<str:username>/liked/', LikedShotsView.as_view(), name='user_liked_shots'),
    path('<str:username>/followers/', FollowersListView.as_view(), name='user_followers'),
    path('<str:username>/following/', FollowingListView.as_view(), name='user_following'),
]
```

> Маршрути для like/save/comments реєструються **автоматично** через DRF Router з `@action` декоратором:
> - `POST /api/shots/:id/like/`
> - `POST /api/shots/:id/save/`
> - `GET|POST /api/shots/:id/comments/`
> - `DELETE /api/shots/:id/comments/:comment_id/`

---

## 9. Оптимізація запитів

У `ShotViewSet.get_queryset()` додати prefetch для уникнення N+1 при серіалізації:

```python
def get_queryset(self):
    qs = Shot.objects.all() \
        .select_related('author') \
        .prefetch_related('tags', 'likes', 'saves', 'comments')
    # ... фільтрація ...
    return qs
```

---

## 10. API Контракт — Фаза 3 (повний список)

| Метод | URL | Auth | Відповідь |
|---|---|---|---|
| POST | `/api/shots/:id/like/` | Yes | `{ liked: bool, likes_count: int }` |
| POST | `/api/shots/:id/save/` | Yes | `{ saved: bool }` |
| GET | `/api/shots/:id/comments/` | No | `[{ id, author, text, created_at }]` |
| POST | `/api/shots/:id/comments/` | Yes | `{ id, author, text, created_at }` |
| DELETE | `/api/shots/:id/comments/:cid/` | Yes (author) | `204 No Content` |
| POST | `/api/users/:username/follow/` | Yes | `{ following: bool, followers_count: int }` |
| GET | `/api/users/:username/liked/` | No | Пагінований список shots |
| GET | `/api/users/:username/followers/` | No | `[{ id, username, avatar, bio }]` |
| GET | `/api/users/:username/following/` | No | `[{ id, username, avatar, bio }]` |

---

## 11. Чеклист тестування

1. `POST /api/shots/1/like/` → `{ liked: true, likes_count: 1 }`
2. `POST /api/shots/1/like/` знову → `{ liked: false, likes_count: 0 }` (toggle)
3. `POST /api/shots/1/comments/` з `{ "text": "Чудова робота!" }` → `201` з коментарем
4. `GET /api/shots/1/comments/` → список коментарів
5. `DELETE /api/shots/1/comments/1/` чужим юзером → `403 Forbidden`
6. `POST /api/users/kyiv_creator/follow/` → `{ following: true, followers_count: 1 }`
7. `POST /api/users/kyiv_creator/follow/` знову → `{ following: false, followers_count: 0 }`
8. `GET /api/users/kyiv_creator/liked/` → список лайкнутих shots (публічно)
9. `GET /api/users/kyiv_creator/followers/` → список підписників
10. `ShotSerializer` — перевірити що `is_liked: true` і `likes_count: 1` після лайку
