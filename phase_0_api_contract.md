# Фаза 0: Узгодження API Контракту

> Це спільний документ між командою бекенду та фронтенду. Має бути погоджений **до початку розробки**.

---

## Загальні угоди

### Base URL

```
Development:  http://localhost:8000/api/
Production:   https://api.dribbble-clone.com/api/
```

### Формат заголовків

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Формат дат

Всі дати повертаються у форматі **ISO 8601**:

```
"2025-06-07T10:30:00Z"
```

### Формат помилок (погоджений стандарт)

Використовуємо стандарт DRF — поле `detail`:

```json
{
  "detail": "Повідомлення про помилку"
}
```

Для помилок валідації (поле по полю):

```json
{
  "email": ["Користувач з таким email вже існує."],
  "password": ["Пароль занадто короткий."]
}
```

### Формат пагінації

```json
{
  "count": 120,
  "next": "http://localhost:8000/api/shots/?limit=20&offset=20",
  "previous": null,
  "results": [...]
}
```

- `count` — загальна кількість об'єктів
- `next` — URL наступної сторінки або `null`
- `previous` — URL попередньої сторінки або `null`
- `results` — масив об'єктів поточної сторінки

Параметри запиту: `?limit=20&offset=0`

---

## Auth API

### `POST /api/auth/register/`

**Запит:**
```json
{
  "email": "user@example.com",
  "username": "designer",
  "password": "securepass123",
  "password2": "securepass123"
}
```

**Відповідь `201 Created`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "designer"
}
```

**Помилки:**
```json
{ "email": ["Користувач з таким email вже існує."] }
{ "password": ["Паролі не співпадають."] }
```

---

### `POST /api/auth/login/`

**Запит:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Відповідь `200 OK`:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Помилки:**
```json
{ "detail": "Невірні облікові дані." }
```

---

### `POST /api/auth/token/refresh/`

**Запит:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Відповідь `200 OK`:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### `POST /api/auth/google/`

**Запит:**
```json
{
  "token": "<Google ID Token від клієнта>"
}
```

**Відповідь `200 OK`:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "created": false
}
```

- `created: true` — новий користувач (перша авторизація через Google)
- `created: false` — існуючий користувач

---

### `GET /api/auth/profile/`

> 🔒 Потребує авторизації

**Відповідь `200 OK`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "designer",
  "avatar": "https://s3.amazonaws.com/bucket/avatars/1.jpg",
  "bio": "UI/UX Designer from Kyiv",
  "website": "https://mysite.com",
  "twitter": "https://twitter.com/handle",
  "instagram": "",
  "linkedin": "",
  "shots_count": 12,
  "followers_count": 48,
  "following_count": 23
}
```

---

### `PATCH /api/auth/profile/`

> 🔒 Потребує авторизації

**Запит (тільки поля що змінюємо):**
```json
{
  "bio": "Product Designer",
  "website": "https://portfolio.com"
}
```

**Аватар** — окремий ендпоінт або `multipart/form-data`:
```
PATCH /api/auth/profile/
Content-Type: multipart/form-data

avatar: <file>
```

**Відповідь `200 OK`:** повний об'єкт профілю (як у GET)

---

## Shots API

### Об'єкт Shot (загальний формат)

```json
{
  "id": 42,
  "title": "Mobile Banking App",
  "description": "A modern banking app redesign concept.",
  "image": "https://s3.amazonaws.com/bucket/shots/42.jpg",
  "preview": "https://s3.amazonaws.com/bucket/shots/42_preview.jpg",
  "tags": ["mobile", "banking", "ui"],
  "author": {
    "id": 1,
    "username": "designer",
    "avatar": "https://s3.amazonaws.com/bucket/avatars/1.jpg"
  },
  "likes_count": 128,
  "comments_count": 14,
  "is_liked": false,
  "is_saved": false,
  "created_at": "2025-06-07T10:30:00Z"
}
```

- `is_liked` — чи поточний користувач вже лайкнув (для авторизованих; `false` для анонімів)
- `is_saved` — чи збережено в обране
- `preview` — стиснуте зображення для стрічки (thumbnail)

---

### `GET /api/shots/` — Feed (глобальна стрічка)

**Параметри запиту:**
```
?limit=20&offset=0
?tags=mobile,ui
?search=banking
?author=1
```

**Відповідь `200 OK`:**
```json
{
  "count": 240,
  "next": "http://localhost:8000/api/shots/?limit=20&offset=20",
  "previous": null,
  "results": [
    { ...Shot },
    { ...Shot }
  ]
}
```

---

### `POST /api/shots/` — Публікація Shot

> 🔒 Потребує авторизації

**Запит (`multipart/form-data`):**
```
title: "Mobile Banking App"
description: "A modern redesign concept."
tags: mobile,banking,ui
image: <file>
```

**Відповідь `201 Created`:** повний об'єкт Shot

---

### `GET /api/shots/:id/` — Детальна сторінка Shot

**Відповідь `200 OK`:** повний об'єкт Shot (той самий формат)

---

### `PATCH /api/shots/:id/` — Редагування Shot

> 🔒 Тільки автор

**Запит:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Відповідь `200 OK`:** оновлений об'єкт Shot

---

### `DELETE /api/shots/:id/`

> 🔒 Тільки автор

**Відповідь `204 No Content`**

---

## Social API

### `POST /api/shots/:id/like/` — Лайк / Анлайк (toggle)

> 🔒 Потребує авторизації

**Відповідь `200 OK`:**
```json
{
  "is_liked": true,
  "likes_count": 129
}
```

При повторному запиті — анлайк:
```json
{
  "is_liked": false,
  "likes_count": 128
}
```

---

### `POST /api/shots/:id/save/` — Зберегти / Видалити з обраного (toggle)

> 🔒 Потребує авторизації

**Відповідь `200 OK`:**
```json
{
  "is_saved": true
}
```

---

### `GET /api/shots/:id/comments/` — Список коментарів

**Відповідь `200 OK` (плоский масив):**
```json
[
  {
    "id": 1,
    "text": "Amazing work!",
    "author": {
      "id": 2,
      "username": "viewer",
      "avatar": "https://..."
    },
    "created_at": "2025-06-07T11:00:00Z"
  }
]
```

---

### `POST /api/shots/:id/comments/` — Додати коментар

> 🔒 Потребує авторизації

**Запит:**
```json
{
  "text": "Дуже круте рішення!"
}
```

**Відповідь `201 Created`:** об'єкт коментаря (як у списку)

---

### `POST /api/users/:username/follow/` — Підписка / Відписка (toggle)

> 🔒 Потребує авторизації

**Відповідь `200 OK`:**
```json
{
  "is_following": true,
  "followers_count": 49
}
```

---

### `GET /api/users/:username/` — Публічний профіль користувача

**Відповідь `200 OK`:**
```json
{
  "id": 2,
  "username": "designer2",
  "avatar": "https://...",
  "bio": "Creative Director",
  "website": "https://...",
  "shots_count": 8,
  "followers_count": 102,
  "following_count": 34,
  "is_following": false
}
```

---

## Search API

### Пошук робіт (Shots)

Пошук робіт виконується безпосередньо через фільтрацію стрічки робіт за допомогою query-параметра `search`:
`GET /api/shots/?search=banking`

**Відповідь `200 OK`:** Пагінований список об'єктів Shot, які відповідають запиту.


---

## Чеклист Фази 0

- [ ] Усі сторони ознайомились з цим документом
- [ ] Погоджено формат пагінації (`count`, `next`, `previous`, `results`)
- [ ] Погоджено формат помилок (`detail` / поле-по-полю)
- [ ] Погоджено формат дат (ISO 8601)
- [ ] Погоджено поля об'єкту `Shot` (особливо `is_liked`, `is_saved`, `preview`)
- [ ] Погоджено toggle-поведінку лайку та підписки
- [ ] Погоджено завантаження Shot через `multipart/form-data`
- [ ] CORS на бекенді налаштовано для `http://localhost:5173`
- [ ] Бекенд генерує OpenAPI схему через `drf-spectacular` (`/api/schema/`)
- [ ] MSW хендлери на фронтенді написані на основі цього документу
