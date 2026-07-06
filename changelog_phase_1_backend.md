# Changelog: phase_1_backend.md — Що було скориговано

> Підстава для змін: аналіз дизайну Figma (design_analysis.md)

---

## ✅ Що залишилось без змін

- Базове налаштування проєкту (venv, pip install, django-admin)
- Модель `User` (AbstractUser + avatar, bio, social links)
- `RegisterSerializer` та `RegisterView`
- `UserProfileSerializer` та `UserProfileView` (GET/PATCH `/api/auth/profile/`)
- Google OAuth через `dj-rest-auth`
- JWT через `djangorestframework-simplejwt`
- CORS, settings.py конфігурація

---

## 🆕 Що було ДОДАНО

### 1. `PublicUserProfileSerializer`

**Чому:** У дизайні є сторінка `/profile/:username` — публічна, доступна без логіну.  
**Що робить:** Повертає профіль будь-якого юзера БЕЗ email. Містить поле `is_following` (заглушка → Фаза 3).

```python
class PublicUserProfileSerializer(serializers.ModelSerializer):
    fields = ('id', 'username', 'avatar', 'bio',
              'website', 'twitter', 'instagram', 'linkedin',
              'shots_count', 'followers_count', 'following_count', 'is_following')
```

---

### 2. `PublicUserProfileView`

**Чому:** Потрібен endpoint `GET /api/users/:username/` для ProfilePage.  
**Що робить:** `RetrieveAPIView` з `permission_classes = [AllowAny]`, lookup по `username`.

---

### 3. `apps/users/public_urls.py` (новий файл)

**Чому:** Щоб відокремити публічні ендпоїнти від авторизаційних.  
**Маршрут:** `GET /api/users/<str:username>/`

---

### 4. `ChangePasswordView`

**Чому:** У дизайні Settings page є секція зміни паролю.  
**Endpoint:** `POST /api/auth/password/change/`  
**Що робить:** Перевіряє `old_password`, встановлює `new_password`.

---

### 5. `ChangePasswordSerializer`

**Поля:** `old_password`, `new_password`, `new_password2`  
**Валідація:** перевірка збігу нових паролів + `validate_password`.

---

### 6. Password Reset flow (через dj-rest-auth)

**Чому:** У дизайні є екрани "Recovery password" та "Recovery password / Confirm it's you".  
**Endpoints:**

- `POST /api/auth/password/reset/` → надсилає email з кодом
- `POST /api/auth/password/reset/confirm/` → підтверджує скидання

Підключено через `include('dj_rest_auth.urls')` в `apps/users/urls.py`.

---

### 7. `.env` — додано email змінні

```env
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

---

## 🔄 Що було ЗМІНЕНО

### `get_shots_count` у `UserProfileSerializer`

- **Було:** `return getattr(obj, 'shots_count_cached', 0)` — завжди 0
- **Стало:** `return obj.shots.count()` — реальна кількість після Фази 2

---

## 📋 Оновлена таблиця API контракту (Фаза 1)

| Метод | URL                                 | Auth | Статус       |
| ----- | ----------------------------------- | ---- | ------------ |
| POST  | `/api/auth/register/`               | No   | ✅ Без змін  |
| POST  | `/api/auth/login/`                  | No   | ✅ Без змін  |
| POST  | `/api/auth/token/refresh/`          | No   | ✅ Без змін  |
| POST  | `/api/auth/google/`                 | No   | ✅ Без змін  |
| GET   | `/api/auth/profile/`                | Yes  | ✅ Без змін  |
| PATCH | `/api/auth/profile/`                | Yes  | ✅ Без змін  |
| POST  | `/api/auth/password/change/`        | Yes  | 🆕 **НОВИЙ** |
| POST  | `/api/auth/password/reset/`         | No   | 🆕 **НОВИЙ** |
| POST  | `/api/auth/password/reset/confirm/` | No   | 🆕 **НОВИЙ** |
| GET   | `/api/users/:username/`             | No   | 🆕 **НОВИЙ** |
