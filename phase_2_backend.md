# Фаза 2: Shots та Feed (Бекенд) — [СКОРИГОВАНА]

> Скориговано на основі аналізу дизайну Figma (design_analysis.md).
> Додані: публічна сторінка профілю, заготовки для like/save (Фаза 3).

---

## 1. Створення додатку `shots`

```bash
python manage.py startapp shots apps/shots
# Виправити apps/shots/apps.py: name = 'apps.shots'
```

Додати в `config/settings.py`:
```python
INSTALLED_APPS = [
    ...
    'apps.users',
    'apps.shots',
]
```

---

## 2. Моделі (`apps/shots/models.py`)

```python
import os
from django.db import models
from django.conf import settings
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)

    def __str__(self):
        return self.name


class Shot(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='shots/')
    preview = models.ImageField(upload_to='shots/previews/', null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name='shots', blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shots'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.image and not self.preview:
            self.generate_preview()
        super().save(*args, **kwargs)

    def generate_preview(self):
        """Генерує оптимізований thumbnail (800x600, JPEG 80%) через Pillow."""
        try:
            img = Image.open(self.image)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.thumbnail((800, 600), Image.Resampling.LANCZOS)
            temp_thumb = BytesIO()
            img.save(temp_thumb, format='JPEG', quality=80)
            temp_thumb.seek(0)
            name = os.path.splitext(os.path.basename(self.image.name))[0]
            self.preview.save(f"{name}_preview.jpg", ContentFile(temp_thumb.read()), save=False)
        except Exception as e:
            print(f"Preview generation error: {e}")
```

```bash
python manage.py makemigrations shots
python manage.py migrate
```

---

## 3. Серіалізатори (`apps/shots/serializers.py`)

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Shot, Tag

User = get_user_model()


class ShotAuthorSerializer(serializers.ModelSerializer):
    """Вкладений автор у картці Shot — тільки публічні дані."""
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar')


class TagRelatedField(serializers.RelatedField):
    """Кастомне поле — теги як масив рядків, з auto-create."""
    def to_representation(self, value):
        return value.name

    def to_internal_value(self, data):
        tag_name = data.strip().lower()
        if not tag_name:
            raise serializers.ValidationError("Назва тегу не може бути порожньою.")
        tag, _ = Tag.objects.get_or_create(name=tag_name)
        return tag


class ShotSerializer(serializers.ModelSerializer):
    author = ShotAuthorSerializer(read_only=True)
    tags = TagRelatedField(many=True, queryset=Tag.objects.all(), required=False)

    # Соціальна взаємодія — заглушки до Фази 3
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Shot
        fields = (
            'id', 'title', 'description', 'image', 'preview',
            'tags', 'author',
            'likes_count', 'comments_count', 'is_liked', 'is_saved',
            'created_at'
        )
        read_only_fields = ('id', 'preview', 'author', 'created_at')

    def get_likes_count(self, obj):
        # TODO Фаза 3: return obj.likes.count()
        return 0

    def get_comments_count(self, obj):
        # TODO Фаза 3: return obj.comments.count()
        return 0

    def get_is_liked(self, obj):
        # TODO Фаза 3: check request.user in obj.likes.all()
        return False

    def get_is_saved(self, obj):
        # TODO Фаза 3: check request.user in obj.saved_by.all()
        return False

    def to_internal_value(self, data):
        """Обробка tags як comma-separated рядка (multipart/form-data)."""
        if 'tags' in data and isinstance(data['tags'], str):
            tags_list = [t.strip() for t in data['tags'].split(',') if t.strip()]
            if hasattr(data, 'copy'):
                mutable = data.copy()
                mutable.setlist('tags', tags_list)
                data = mutable
            else:
                data = {**data, 'tags': tags_list}
        return super().to_internal_value(data)
```

---

## 4. Views (`apps/shots/views.py`)

```python
from rest_framework import viewsets, permissions, filters
from rest_framework.pagination import LimitOffsetPagination
from .models import Shot
from .serializers import ShotSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class ShotsPagination(LimitOffsetPagination):
    default_limit = 12
    max_limit = 50


class ShotViewSet(viewsets.ModelViewSet):
    """
    CRUD для Shots.
    
    Фільтрація:
    - ?search=query        → пошук по title і description
    - ?tags=ui,design      → фільтр по тегах (AND логіка)
    - ?author=:id          → shots конкретного автора (для ProfilePage)
    - ?limit=12&offset=0   → пагінація
    """
    queryset = Shot.objects.all().select_related('author').prefetch_related('tags')
    serializer_class = ShotSerializer
    pagination_class = ShotsPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()

        author_id = self.request.query_params.get('author')
        if author_id:
            qs = qs.filter(author_id=author_id)

        tags_param = self.request.query_params.get('tags')
        if tags_param:
            for tag_name in [t.strip().lower() for t in tags_param.split(',') if t.strip()]:
                qs = qs.filter(tags__name=tag_name)

        return qs
```

---

## 5. Маршрути

### `apps/shots/urls.py`
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShotViewSet

router = DefaultRouter()
router.register(r'shots', ShotViewSet, basename='shot')

urlpatterns = [path('', include(router.urls))]
```

### Оновлений `config/urls.py`
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.public_urls')),  # GET /api/users/:username/
    path('api/', include('apps.shots.urls')),               # /api/shots/ CRUD

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 6. API Контракт — Фаза 2 (повний список)

| Метод | URL | Auth | Опис |
|---|---|---|---|
| GET | `/api/shots/` | No | Список shots (пагінація + фільтри) |
| POST | `/api/shots/` | Yes | Створити shot (multipart) |
| GET | `/api/shots/:id/` | No | Деталі одного shot |
| PATCH | `/api/shots/:id/` | Yes (author) | Редагувати shot |
| DELETE | `/api/shots/:id/` | Yes (author) | Видалити shot |
| GET | `/api/shots/?author=:id` | No | Shots конкретного автора |
| GET | `/api/shots/?tags=ui,design` | No | Фільтр по тегах |
| GET | `/api/shots/?search=query` | No | Пошук по назві/опису |
| GET | `/api/users/:username/` | No | Публічний профіль (з Фази 1) |

**Формат відповіді для GET /api/shots/:**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/shots/?limit=12&offset=12",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Shot title",
      "description": "...",
      "image": "/media/shots/image.jpg",
      "preview": "/media/shots/previews/image_preview.jpg",
      "tags": ["ui", "mobile"],
      "author": { "id": 1, "username": "kyiv_creator", "avatar": "/media/avatars/..." },
      "likes_count": 0,
      "comments_count": 0,
      "is_liked": false,
      "is_saved": false,
      "created_at": "2026-07-06T12:00:00Z"
    }
  ]
}
```

---

## 7. Чеклист тестування

1. `POST /api/shots/` (з auth + multipart + image файл) → `201` + об'єкт з `preview` url
2. `GET /api/shots/` → `200` з пагінацією
3. `GET /api/shots/?author=1` → тільки shots цього автора
4. `GET /api/shots/?tags=mobile` → відфільтровані results
5. `GET /api/shots/?search=dashboard` → пошук по назві
6. `DELETE /api/shots/:id/` чужим юзером → `403 Forbidden`
7. `GET /api/users/kyiv_creator/` → публічний профіль без email

---

## 8. Інтеграція Cloudflare R2 для зберігання медіафайлів (S3-compatible)

Для використання Cloudflare R2 замість локального збереження файлів у Django, виконайте наступні кроки:

### 8.1. Встановлення пакетів
```bash
pip install django-storages boto3
```

### 8.2. Конфігурація `config/settings.py`

Додайте конфігурацію сховища, яка використовує інтерфейс S3 для Cloudflare R2:

```python
# settings.py

# Налаштування django-storages для Cloudflare R2
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# Cloudflare R2 Credentials
AWS_ACCESS_KEY_ID = env('R2_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('R2_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('R2_BUCKET_NAME')
AWS_S3_ENDPOINT_URL = env('R2_ENDPOINT_URL')  # Формат: https://<accountid>.r2.cloudflarestorage.com

# Для публічного доступу до медіафайлів без підпису
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False

# Опціонально: кастомний домен Cloudflare для CDN
AWS_S3_CUSTOM_DOMAIN = env('R2_CUSTOM_DOMAIN', default=None)  # Наприклад, media.voxel.com
```

### 8.3. Змінні оточення у `.env`
```env
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=voxel-media
R2_ENDPOINT_URL=https://xxxxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_CUSTOM_DOMAIN=pub-xxxxxxxxxxxxxx.r2.dev  # Або ваш власний домен, прикріплений до R2 bucket
```

