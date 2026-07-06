#  Фаза 4: Оптимізація, тестування та фіналізація (Бекенд)

> Стек: Django REST Framework  
> Опис: Оптимізація та тестування бекенду після завершення Фаз 1, 2 та 3.

---

## План реалізації

| Задача | Деталі реалізації |
|---|---|
| Кешування через Redis | Налаштування бібліотеки `django-redis` та сховища кешу у `settings.py` |
|   Shots Feed | Кешування публічної стрічки робіт для анонімних запитів |
| Інвалідація кешу | Очищення кешу при додаванні, зміні чи видаленні робіт |
| Обмеження частоти (Throttling) | Захист чутливих ендпоінтів (Login, Password Reset) від брутфорсу |
| Документація API | Інтеграція `drf-spectacular` для генерації OpenAPI/Swagger |
| Автоматизовані тести | Тестування Auth Flow, Shots CRUD, Likes & Comments |

---

## 1. Налаштування Redis та кешування (`config/settings.py`)

### 1.1. Встановлення залежностей
```bash
pip install django-redis Redis
```

### 1.2. Конфігурація сховища кешу у `settings.py`
```python
# settings.py

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Час життя кешу за замовчуванням (у секундах)
CACHE_TTL = 60 * 15  # 15 хвилин
```

---

## 2. Реалізація кешування стрічки та інвалідації

Кешування стрічки Shots допоможе суттєво розвантажити базу даних.

### 2.1. Кешування у `ShotViewSet` (`apps/shots/views.py`)
Використовуємо інструменти кешування Django (`django.core.cache`) для контролю запитів.

```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie

class ShotViewSet(viewsets.ModelViewSet):
    # ... існуючий код ...

    # Кешуємо тільки GET-запит списку (Feed) на 5 хвилин
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_cookie)  # Різний кеш для авторизованих/анонімів через JWT токен/сесію
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

### 2.2. Інвалідація кешу через Django Signals (`apps/shots/signals.py`)
Коли створюється новий Shot, редагується або видаляється існуючий, кеш стрічки має бути негайно очищений.

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Shot

@receiver(post_save, sender=Shot)
@receiver(post_delete, sender=Shot)
def invalidate_shots_cache(sender, instance, **kwargs):
    """Очищення кешу стрічки робіт при будь-яких змінах."""
    # Очищуємо весь кеш або специфічні ключі
    cache.clear() # Простий варіант для MVP
```

Не забудьте підключити сигнали у `apps/shots/apps.py`:
```python
# apps/shots/apps.py
class ShotsConfig(AppConfig):
    name = 'apps.shots'

    def ready(self):
        import apps.shots.signals
```

---

## 3. Обмеження частоти запитів (Throttling / Rate Limiting)

Захищає API від спаму, DDoS-атак та спроб підбору паролів.

### 3.1. Глобальні налаштування у `settings.py`
```python
# settings.py

REST_FRAMEWORK = {
    # ...
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',      # 100 запитів на день для анонімів
        'user': '1000/hour',    # 1000 запитів на годину для авторизованих
        'auth': '5/minute',     # Спеціальний ліміт для авторизації
    }
}
```

### 3.2. Застосування ліміту для входу та відновлення паролю (`apps/users/views.py`)
```python
from rest_framework.throttling import ScopedRateThrottle

class RegisterView(generics.CreateAPIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'  # ліміт 5 запитів на хвилину
    # ...

# Аналогічно для TokenObtainPairView (Login) та PasswordResetView
```

---

## 4. Автоматична генерація документації API (`drf-spectacular`)

### 4.1. Конфігурація Swagger / OpenAPI у `settings.py`
```python
# settings.py

REST_FRAMEWORK = {
    # ...
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Dribbble API',
    'DESCRIPTION': 'API для клону Dribbble з підтримкою автентифікації, завантаження Shots та соціальних функцій',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}
```

Ендпоінти для перегляду документації підключені у `config/urls.py` ще у Фазі 1:
* `/api/schema/` — сира схема JSON
* `/api/schema/swagger-ui/` — інтерактивний інтерфейс Swagger

---

## 5. Автоматизовані тести (PyTest)

Написання тестів для перевірки ключових функцій системи.

### 5.1. Налаштування середовища тестування
```bash
pip install pytest pytest-django pytest-cov
```

Створити файл `pytest.ini` у корені проєкту:
```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests.py test_*.py *_tests.py
```

### 5.2. Тест авторизації та профілю (`apps/users/tests/test_auth.py`)
```python
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    url = reverse('auth_register')
    data = {
        "email": "test@example.com",
        "username": "tester",
        "password": "Password123!",
        "password2": "Password123!"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == 201
    assert response.data['username'] == 'tester'
    assert User.objects.filter(email='test@example.com').exists()

@pytest.mark.django_db
def test_user_login():
    # Створити користувача
    user = User.objects.create_user(email='test@example.com', username='tester', password='Password123!')
    
    client = APIClient()
    url = reverse('token_obtain_pair')
    data = {
        "email": "test@example.com",
        "password": "Password123!"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
```

### 5.3. Тест Shots CRUD (`apps/shots/tests/test_shots.py`)
```python
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from apps.shots.models import Shot

@pytest.mark.django_db
def test_create_shot(auth_client, test_user): # auth_client та test_user — фікстури pytest
    url = reverse('shot-list') # реєстрація через Router
    
    # Фейковий файл зображення
    image = SimpleUploadedFile("design.png", b"file_content", content_type="image/png")
    
    data = {
        "title": "My Design",
        "description": "Minimal design concept",
        "tags": "ui,mobile",
        "image": image
    }
    response = auth_client.post(url, data, format='multipart')
    
    assert response.status_code == 201
    assert Shot.objects.count() == 1
    assert Shot.objects.first().tags.count() == 2
```

---

## 6. Чеклист тестування та фіналізації Фази 4 (Бекенд)

- [ ] Запущено Redis сервер локально
- [ ] Виконано `pytest` — усі тести пройдено (зелені)
- [ ] Запит `GET /api/shots/` виконується швидше за 30мс при повторних викликах (завдяки Redis)
- [ ] Перевірено ліміти запитів: 6-й поспіль запит на реєстрацію з однієї IP повертає `429 Too Many Requests`
- [ ] Документація Swagger за адресою `/api/schema/swagger-ui/` відображає всі ендпоінти, моделі та описи параметрів
