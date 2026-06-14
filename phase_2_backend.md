# Детальний опис Фази 2: Shots та Feed (Бекенд)

Цей документ містить покрокову інструкцію для розробки бекенд-частини **Фази 2 (Shots та Feed)** на базі Django REST Framework та Pillow для обробки зображень.

---

## 1. Створення додатку `shots` та налаштування

1. **Створення додатку в директорії `apps/`:**
   ```bash
   python manage.py startapp shots apps/shots
   ```
   *Примітка: Перенесіть додаток `shots` в папку `apps/` (якщо вона не була створена автоматично в правильному місці) та відредагуйте `apps/shots/apps.py`, вказавши `name = 'apps.shots'`.*

2. **Встановлення Pillow (якщо ще не встановлено):**
   ```bash
   pip install Pillow
   pip freeze > requirements.txt
   ```

3. **Реєстрація додатку в `config/settings.py`:**
   ```python
   INSTALLED_APPS = [
       ...
       # Local apps
       'apps.users',
       'apps.shots',  # Додаємо наш новий додаток
   ]
   ```

---

## 2. Моделі `Tag` та `Shot` (`apps/shots/models.py`)

Для збереження робіт (Shots) та їхніх тегів. Кожен Shot має мати основне зображення та згенероване прев'ю (стиснуте/зменшене) для швидкого завантаження стрічки.

```python
import os
from django.db import models
from django.conf import settings
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)

    class Meta:
        verbose_name = 'Тег'
        verbose_name_plural = 'Теги'

    def __str__(self):
        return self.name


class Shot(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Файли робіт
    image = models.ImageField(upload_to='shots/')
    preview = models.ImageField(upload_to='shots/previews/', null=True, blank=True)
    
    # Зв'язки
    tags = models.ManyToManyField(Tag, related_name='shots', blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shots'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Робота (Shot)'
        verbose_name_plural = 'Роботи (Shots)'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Якщо завантажено нове зображення, але прев'ю ще не створено
        if self.image and not self.preview:
            self.generate_preview()
        super().save(*args, **kwargs)

    def generate_preview(self):
        """
        Автоматично створює оптимізоване прев'ю зображення (thumbnail)
        за допомогою Pillow для збереження трафіку в стрічці.
        """
        try:
            # Відкриваємо оригінальне зображення
            img = Image.open(self.image)
            
            # Конвертуємо в RGB, якщо зображення в RGBA (наприклад PNG), для збереження в JPEG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Робимо ресайз до максимальних розмірів 800x600 (із збереженням аспектного співвідношення)
            img.thumbnail((800, 600), Image.Resampling.LANCZOS)
            
            temp_thumb = BytesIO()
            img.save(temp_thumb, format='JPEG', quality=80)
            temp_thumb.seek(0)
            
            # Формуємо ім'я файлу для прев'ю
            filename = os.path.basename(self.image.name)
            name, _ = os.path.splitext(filename)
            preview_filename = f"{name}_preview.jpg"
            
            # Зберігаємо у поле preview без повторного виклику save() моделі
            self.preview.save(preview_filename, ContentFile(temp_thumb.read()), save=False)
        except Exception as e:
            # Логування помилки, якщо зображення пошкоджене
            print(f"Помилка створення прев'ю: {e}")
```

*Створіть та застосуйте міграції:*
```bash
python manage.py makemigrations shots
python manage.py migrate
```

---

## 3. Інтеграція хмарного сховища (Cloudinary / AWS S3)

Для збереження зображень на продакшені рекомендується використовувати `django-storages`.

1. **Встановлення бібліотек:**
   ```bash
   pip install django-storages boto3 django-cloudinary-storage
   ```

2. **Налаштування S3/Cloudinary у `config/settings.py` (приклад):**
   ```python
   # Додайте конфігурацію сховища, яка вмикається в залежності від середовища
   USE_S3 = config('USE_S3', default=False, cast=bool)
   USE_CLOUDINARY = config('USE_CLOUDINARY', default=False, cast=bool)

   if USE_S3:
       INSTALLED_APPS += ['storages']
       AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
       AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
       AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
       AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
       AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
       
       DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
       MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
       
   elif USE_CLOUDINARY:
       INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
       CLOUDINARY_STORAGE = {
           'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME'),
           'API_KEY': config('CLOUDINARY_API_KEY'),
           'API_SECRET': config('CLOUDINARY_API_SECRET'),
       }
       DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

---

## 4. Серіалізатори (`apps/shots/serializers.py`)

Серіалізатор для Shot має містити вкладеного автора, список тегів у вигляді масиву рядків (і створювати нові теги на льоту при завантаженні), а також повертати заглушки для соціальних взаємодій Фази 3.

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Shot, Tag
from apps.users.serializers import UserProfileSerializer

User = get_user_model()

# Спрощений серіалізатор автора для вкладеного відображення в Shot
class ShotAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar')


# Кастомне поле для тегів, що дозволяє створювати їх на льоту
class TagRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        return value.name

    def to_internal_value(self, data):
        # Нормалізуємо назву тегу (прибираємо пробіли, переводимо в нижній регістр)
        tag_name = data.strip().lower()
        if not tag_name:
            raise serializers.ValidationError("Назва тегу не може бути порожньою.")
        tag, created = Tag.objects.get_or_create(name=tag_name)
        return tag


class ShotSerializer(serializers.ModelSerializer):
    author = ShotAuthorSerializer(read_only=True)
    tags = TagRelatedField(many=True, queryset=Tag.objects.all(), required=False)
    
    # Поля соціальної взаємодії (будуть реалізовані у Фазі 3)
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
        # Заглушка для Фази 2. Буде оновлено у Фазі 3.
        return 0

    def get_comments_count(self, obj):
        # Заглушка для Фази 2. Буде оновлено у Фазі 3.
        return 0

    def get_is_liked(self, obj):
        # Заглушка для Фази 2. Буде оновлено у Фазі 3.
        return False

    def get_is_saved(self, obj):
        # Заглушка для Фази 2. Буде оновлено у Фазі 3.
        return False

    def to_internal_value(self, data):
        """
        Спеціальна обробка для multipart/form-data. 
        Якщо tags приходить як рядок розділений комами (наприклад "design,ui,app"),
        ми конвертуємо його у список перед передачею у валідатор.
        """
        if 'tags' in data and isinstance(data['tags'], str):
            tags_list = [t.strip() for t in data['tags'].split(',') if t.strip()]
            
            # Створюємо копію QueryDict для безпечної мутації
            if hasattr(data, 'copy'):
                mutable_data = data.copy()
                mutable_data.setlist('tags', tags_list)
                data = mutable_data
            else:
                data = {**data, 'tags': tags_list}
                
        return super().to_internal_value(data)
```

---

## 5. Views (`apps/shots/views.py`)

Нам потрібен стандартний REST CRUD для роботи з Shots, а також підтримка фільтрації, пошуку та пагінації.

```python
from rest_framework import viewsets, permissions, filters
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Shot
from .serializers import ShotSerializer

class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Дозвіл: редагувати чи видаляти Shot може тільки його автор.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class ShotsPagination(LimitOffsetPagination):
    default_limit = 12
    max_limit = 50


class ShotViewSet(viewsets.ModelViewSet):
    queryset = Shot.objects.all().select_related('author').prefetch_related('tags')
    serializer_class = ShotSerializer
    pagination_class = ShotsPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    
    # Фільтрація та Пошук
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        # Автоматично зберігаємо поточного авторизованого користувача як автора роботи
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Ручна фільтрація за id автора (?author=3)
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)
            
        # Ручна фільтрація за тегами (?tags=ui,design)
        # Поверне роботи, які містять ВСІ перелічені теги
        tags_param = self.request.query_params.get('tags')
        if tags_param:
            tags_list = [t.strip().lower() for t in tags_param.split(',') if t.strip()]
            for tag_name in tags_list:
                queryset = queryset.filter(tags__name=tag_name)
                
        return queryset
```

---

## 6. Налаштування маршрутів

1. **Створення маршрутів додатку `apps/shots/urls.py`:**
   ```python
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   from .views import ShotViewSet

   router = DefaultRouter()
   router.register(r'shots', ShotViewSet, basename='shot')

   urlpatterns = [
       path('', include(router.urls)),
   ]
   ```

2. **Підключення в глобальний `config/urls.py`:**
   ```python
   urlpatterns = [
       path('admin/', admin.site.urls),
       path('api/auth/', include('apps.users.urls')),
       path('api/', include('apps.shots.urls')),  # Додаємо маршрути shots
       
       # OpenAPI Swagger
       path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
       path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
   ]
   ```

---

## 7. Чеклист тестування для бекенд-команди

Перед демонстрацією та переходом до інтеграції виконайте перевірку через клієнт (наприклад, Postman):

1. **Створення роботи (Авторизований запит):**
   - Метод: `POST` `/api/shots/`
   - Headers: `Authorization: Bearer <token>`
   - Body: `form-data`
     - `title`: `My First Shot`
     - `description`: `This is a test description`
     - `tags`: `ui, web, dashboard` (через кому)
     - `image`: `<file.png>` (вибрати зображення)
   - Результат: `201 Created` з об'єктом Shot, де `preview` містить шлях до згенерованого зменшеного зображення, а `tags` — масив `["ui", "web", "dashboard"]`.

2. **Отримання стрічки (Анонімний запит):**
   - Метод: `GET` `/api/shots/?limit=10&offset=0`
   - Результат: `200 OK` у форматі пагінації:
     ```json
     {
       "count": 1,
       "next": null,
       "previous": null,
       "results": [...]
     }
     ```

3. **Фільтрація та пошук:**
   - Перевірити: `GET` `/api/shots/?search=First` -> знаходить роботу.
   - Перевірити: `GET` `/api/shots/?tags=web` -> повертає роботу.
   - Перевірити: `GET` `/api/shots/?tags=mobile` -> повертає порожній результат.

4. **Редагування роботи:**
   - Метод: `PATCH` `/api/shots/<id>/` (тільки автор)
   - Body: `{ "title": "Updated Shot Title" }`
   - Результат: `200 OK` з оновленою назвою.

5. **Видалення роботи:**
   - Метод: `DELETE` `/api/shots/<id>/`
   - Спроба видалити чужий Shot -> `403 Forbidden`.
   - Видалення власного Shot -> `204 No Content`.
