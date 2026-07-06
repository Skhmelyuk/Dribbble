# Фаза 1: Налаштування та Авторизація (Бекенд) — [СКОРИГОВАНА]

> Скориговано на основі аналізу дизайну Figma (design_analysis.md).
> Додані: Recovery Password flow, публічний endpoint профілю, password change.

---

## 1. Налаштування проєкту та бази даних

```bash
python -m venv venv
source venv/bin/activate
pip install django djangorestframework psycopg2-binary python-decouple \
    djangorestframework-simplejwt Pillow django-allauth dj-rest-auth \
    django-cors-headers drf-spectacular
pip freeze > requirements.txt
```

```bash
django-admin startproject config .
mkdir apps
python manage.py startapp users apps/users
# Виправити apps/users/apps.py: name = 'apps.users'
```

**.env:**
```env
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=True
DB_NAME=dribbble_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

---

## 2. Модель користувача (`apps/users/models.py`)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    website = models.URLField(blank=True, max_length=255)
    twitter = models.URLField(blank=True, max_length=255)
    instagram = models.URLField(blank=True, max_length=255)
    linkedin = models.URLField(blank=True, max_length=255)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.email})"
```

```bash
python manage.py makemigrations users
python manage.py migrate
```

---

## 3. Серіалізатори (`apps/users/serializers.py`)

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# --- Реєстрація ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Паролі не співпадають.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


# --- Свій профіль (GET/PATCH /api/auth/profile/) ---
class UserProfileSerializer(serializers.ModelSerializer):
    shots_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'avatar', 'bio',
            'website', 'twitter', 'instagram', 'linkedin',
            'shots_count', 'followers_count', 'following_count'
        )
        read_only_fields = ('id', 'email', 'shots_count', 'followers_count', 'following_count')

    def get_shots_count(self, obj):
        # Буде реальним після Фази 2
        return getattr(obj, 'shots').count() if hasattr(obj, 'shots') else 0

    def get_followers_count(self, obj):
        return 0  # Фаза 3

    def get_following_count(self, obj):
        return 0  # Фаза 3


# --- Публічний профіль (GET /api/users/:username/) ---
class PublicUserProfileSerializer(serializers.ModelSerializer):
    shots_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Не повертаємо email для публічного профілю
        fields = (
            'id', 'username', 'avatar', 'bio',
            'website', 'twitter', 'instagram', 'linkedin',
            'shots_count', 'followers_count', 'following_count', 'is_following'
        )

    def get_shots_count(self, obj):
        return obj.shots.count() if hasattr(obj, 'shots') else 0

    def get_followers_count(self, obj):
        return 0  # Фаза 3

    def get_following_count(self, obj):
        return 0  # Фаза 3

    def get_is_following(self, obj):
        return False  # Фаза 3


# --- Зміна паролю ---
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Нові паролі не співпадають.'})
        return attrs
```

---

## 4. Views (`apps/users/views.py`)

```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    PublicUserProfileSerializer, ChangePasswordSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — реєстрація нового користувача"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/ — свій профіль (авторизований)"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PublicUserProfileView(generics.RetrieveAPIView):
    """GET /api/users/:username/ — публічна сторінка профілю будь-якого юзера"""
    serializer_class = PublicUserProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'
    queryset = User.objects.all()


class ChangePasswordView(APIView):
    """POST /api/auth/password/change/ — зміна паролю авторизованого юзера"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Невірний поточний пароль.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Пароль успішно змінено.'}, status=status.HTTP_200_OK)
```

---

## 5. Google OAuth (`apps/users/google_auth.py`)

```python
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = 'http://localhost:5173/login'
```

---

## 6. Маршрути

### `apps/users/urls.py`
```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView, PublicUserProfileView, ChangePasswordView
from .google_auth import GoogleLogin

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleLogin.as_view(), name='google_login'),

    # Profile (власний)
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('password/change/', ChangePasswordView.as_view(), name='password_change'),

    # Password Reset (через dj-rest-auth вбудований)
    # POST /api/auth/password/reset/ → { email }
    # POST /api/auth/password/reset/confirm/ → { uid, token, new_password1, new_password2 }
    path('', include('dj_rest_auth.urls')),
]
```

### `config/urls.py`
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.public_urls')),  # Публічні ендпоїнти

    # OpenAPI Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### `apps/users/public_urls.py` (новий файл)
```python
from django.urls import path
from .views import PublicUserProfileView

urlpatterns = [
    # GET /api/users/john_doe/ → публічний профіль
    path('<str:username>/', PublicUserProfileView.as_view(), name='public_user_profile'),
]
```

---

## 7. API Контракт — Фаза 1 (повний список)

| Метод | URL | Auth | Опис |
|---|---|---|---|
| POST | `/api/auth/register/` | No | Реєстрація |
| POST | `/api/auth/login/` | No | Логін, повертає JWT |
| POST | `/api/auth/token/refresh/` | No | Оновлення access token |
| POST | `/api/auth/google/` | No | Google OAuth |
| GET | `/api/auth/profile/` | Yes | Свій профіль |
| PATCH | `/api/auth/profile/` | Yes | Оновлення профілю (multipart) |
| POST | `/api/auth/password/change/` | Yes | Зміна паролю |
| POST | `/api/auth/password/reset/` | No | Запит скидання паролю (email) |
| POST | `/api/auth/password/reset/confirm/` | No | Підтвердження скидання |
| GET | `/api/users/:username/` | No | Публічний профіль будь-якого юзера |

---

## 8. Чеклист тестування

1. `POST /api/auth/register/` → `201 Created`
2. `POST /api/auth/login/` → `{ access, refresh }`
3. `GET /api/auth/profile/` з Bearer token → профіль поточного юзера
4. `PATCH /api/auth/profile/` (multipart з avatar файлом) → оновлений профіль
5. `POST /api/auth/password/change/` → `{ detail: "Пароль успішно змінено." }`
6. `GET /api/users/kyiv_creator/` (без токена) → публічний профіль
7. CORS: запити з `http://localhost:5173` не блокуються
