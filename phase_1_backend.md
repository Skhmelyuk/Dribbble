# Детальний опис Фази 1: Налаштування та Авторизація (Бекенд)

Цей документ містить покрокову інструкцію для розробки бекенд-частини **Фази 1 (Налаштування та Авторизація)** на базі Django REST Framework.

---

## 1. Налаштування проєкту та бази даних

1. **Створення віртуального оточення та встановлення залежностей:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install django djangorestframework psycopg2-binary python-decouple djangorestframework-simplejwt Pillow django-allauth dj-rest-auth django-cors-headers drf-spectacular
   pip freeze > requirements.txt
   ```

2. **Ініціалізація проєкту:**
   ```bash
   django-admin startproject config .
   ```

3. **Створення додатку `users`:**
   ```bash
   mkdir apps
   python manage.py startapp users apps/users
   ```
   *Примітка: Перенесіть додаток `users` в папку `apps/` та відредагуйте `apps/users/apps.py`, вказавши `name = 'apps.users'`.*

4. **Конфігурація `.env` файлу:**
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
   ```

5. **Налаштування `config/settings.py`:**
   ```python
   import os
   from pathlib import Path
   from datetime import timedelta
   from decouple import config

   BASE_DIR = Path(__file__).resolve().parent.parent

   SECRET_KEY = config('SECRET_KEY')
   DEBUG = config('DEBUG', default=False, cast=bool)

   ALLOWED_HOSTS = ['localhost', '127.0.0.1']

   INSTALLED_APPS = [
       # Django core
       'django.contrib.admin',
       'django.contrib.auth',
       'django.contrib.contenttypes',
       'django.contrib.sessions',
       'django.contrib.messages',
       'django.contrib.staticfiles',
       'django.contrib.sites',

       # Third-party
       'rest_framework',
       'rest_framework.authtoken',
       'corsheaders',
       'drf_spectacular',
       'rest_framework_simplejwt',
       
       # django-allauth & dj-rest-auth
       'allauth',
       'allauth.account',
       'allauth.socialaccount',
       'allauth.socialaccount.providers.google',
       'dj_rest_auth',
       'dj_rest_auth.registration',

       # Local apps
       'apps.users',
   ]

   SITE_ID = 1

   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware', # Має бути першим
       'django.middleware.security.SecurityMiddleware',
       'django.contrib.sessions.middleware.SessionMiddleware',
       'django.middleware.common.CommonMiddleware',
       'django.middleware.csrf.CsrfViewMiddleware',
       'django.contrib.auth.middleware.AuthenticationMiddleware',
       'django.contrib.messages.middleware.MessageMiddleware',
       'django.middleware.clickjacking.XFrameOptionsMiddleware',
   ]

   ROOT_URLCONF = 'config.urls'

   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': config('DB_NAME'),
           'USER': config('DB_USER'),
           'PASSWORD': config('DB_PASSWORD'),
           'HOST': config('DB_HOST', default='localhost'),
           'PORT': config('DB_PORT', default='5432'),
       }
   }

   AUTH_USER_MODEL = 'users.User'

   REST_FRAMEWORK = {
       'DEFAULT_AUTHENTICATION_CLASSES': (
           'rest_framework_simplejwt.authentication.JWTAuthentication',
       ),
       'DEFAULT_PERMISSION_CLASSES': (
           'rest_framework.permissions.IsAuthenticated',
       ),
       'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
   }

   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
       'ROTATE_REFRESH_TOKENS': True,
       'BLACKLIST_AFTER_ROTATION': True,
       'ALGORITHM': 'HS256',
       'SIGNING_KEY': SECRET_KEY,
       'AUTH_HEADER_TYPES': ('Bearer',),
   }

   # CORS конфігурація для фронтенду
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:5173',
   ]

   # django-allauth & Google OAuth конфіг
   ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
   ACCOUNT_EMAIL_REQUIRED = True
   ACCOUNT_USERNAME_REQUIRED = True
   ACCOUNT_AUTHENTICATION_METHOD = 'email'
   ACCOUNT_EMAIL_VERIFICATION = 'none' # Для MVP вимикаємо підтвердження поштою

   SOCIALACCOUNT_PROVIDERS = {
       'google': {
           'SCOPE': ['profile', 'email'],
           'AUTH_PARAMS': {'access_type': 'online'},
           'APP': {
               'client_id': config('GOOGLE_CLIENT_ID'),
               'secret': config('GOOGLE_CLIENT_SECRET'),
           }
       }
   }

   # Медіа-файли (аватари та шоти)
   MEDIA_URL = '/media/'
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   ```

---

## 2. Кастомна Модель Користувача (`apps/users/models.py`)

Модель розширює стандартну модель `AbstractUser` для збереження аватара, інформації про себе та посилань на соцмережі.

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    
    # Соціальні мережі
    website = models.URLField(blank=True, max_length=255)
    twitter = models.URLField(blank=True, max_length=255)
    instagram = models.URLField(blank=True, max_length=255)
    linkedin = models.URLField(blank=True, max_length=255)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

    def __str__(self):
        return f"{self.username} ({self.email})"
```

*Не забудьте виконати створення міграцій та їх застосування:*
```bash
python manage.py makemigrations users
python manage.py migrate
```

---

## 3. Серіалізатори авторизації та реєстрації (`apps/users/serializers.py`)

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

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
        return User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )

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
        return getattr(obj, 'shots_count_cached', 0)

    def get_followers_count(self, obj):
        return getattr(obj, 'followers_count_cached', 0)

    def get_following_count(self, obj):
        return getattr(obj, 'following_count_cached', 0)
```

---

## 4. Views для роботи з профілем та реєстрацією (`apps/users/views.py`)

```python
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserProfileSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
```

---

## 5. Налаштування Google OAuth View (`apps/users/google_auth.py`)

```python
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = 'http://localhost:5173/login' # URL повернення на фронтенді
```

---

## 6. Маршрути (`apps/users/urls.py` & `config/urls.py`)

**Маршрути додатку `apps/users/urls.py`:**
```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView
from .google_auth import GoogleLogin

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]
```

**Глобальні маршрути `config/urls.py`:**
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    
    # OpenAPI Swagger Документація
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 7. Чеклист тестування для бекенд-команди

Перед передачею API команді фронтенду, виконайте наступні перевірки (можна через Postman / Bruno):

1. **Реєстрація:**
   - `POST /api/auth/register/` з тілом `{ "email": "test@test.com", "username": "test", "password": "PassWord123!", "password2": "PassWord123!" }` -> Має повернути `201 Created`.
2. **Логін:**
   - `POST /api/auth/login/` з тими ж даними -> Має повернути `access` та `refresh` токени.
3. **Отримання профілю:**
   - `GET /api/auth/profile/` з заголовком `Authorization: Bearer <access>` -> Має повернути дані профілю.
4. **Оновлення профілю:**
   - `PATCH /api/auth/profile/` (multipart/form-data) з файлом `avatar` та іншими текстовими полями -> Має успішно оновити модель та повернути новий об'єкт.
5. **CORS:**
   - Переконайтеся, що HTTP запити з `http://localhost:5173` дозволені та не блокуються.
