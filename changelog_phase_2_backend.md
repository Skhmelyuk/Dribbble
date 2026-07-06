# Changelog: phase_2_backend.md — Що було скориговано

> Підстава для змін: аналіз дизайну Figma (design_analysis.md)

---

## ✅ Що залишилось без змін
- Модель `Tag` та `Shot`
- `generate_preview()` через Pillow
- `ShotAuthorSerializer`
- `TagRelatedField` (auto-create тегів)
- `ShotSerializer` з заглушками `likes_count`, `is_liked`, `is_saved`
- `IsAuthorOrReadOnly` permission
- `ShotViewSet` з фільтрацією та пошуком
- `ShotsPagination` (limit/offset)
- Підключення через DRF Router

---

## 🆕 Що було ДОДАНО

### 1. Фільтр по автору `?author=:id`
**Чому:** ProfilePage показує shots конкретного юзера — потрібна фільтрація.  
**Вже було** в оригінальному коді — **залишено та явно задокументовано**.

---

### 2. `GET /api/users/:username/` підключено у `config/urls.py`
**Чому:** Публічний профіль потрібен і в контексті Фази 2 (ProfilePage на фронтенді).  
**Реалізовано у Фазі 1** через `apps/users/public_urls.py`, але в `config/urls.py` Фази 2 явно підключено:
```python
path('api/users/', include('apps.users.public_urls')),
```

---

### 3. TODO-коментарі у заглушках Фази 3
**Чому:** Чітке маркування для розробника — що саме міняти у Фазі 3.
```python
def get_likes_count(self, obj):
    # TODO Фаза 3: return obj.likes.count()
    return 0
```

---

### 4. Інтеграція Cloudflare R2 для зберігання медіафайлів
**Чому:** Проєкт мігрував на використання Cloudflare R2 як основного сховища медіафайлів.  
**Що додано:** Додано детальну інструкцію з налаштування `django-storages` та `boto3` у секції 8 документа `phase_2_backend.md`, включаючи приклади налаштувань `settings.py` та змінні у `.env`.

---

## 🔄 Що було ЗМІНЕНО

### Змінено хмарне сховище з Cloudinary/S3 на Cloudflare R2
**Чому:** Рішення використовувати Cloudflare R2 як більш вигідну та надійну альтернативу AWS S3 / Cloudinary без плати за вихідний трафік (egress fees).  
**Що змінено:** Замінено всі згадки AWS S3 / Cloudinary у документах планів реалізації на Cloudflare R2 та додано детальний опис конфігурації.

---

### Оновлена таблиця API контракту
Явно додано рядки для фільтрів:

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/shots/?author=:id` | 🆕 **Явно задокументовано** — shots автора |
| GET | `/api/shots/?tags=ui,design` | ✅ Без змін |
| GET | `/api/shots/?search=query` | ✅ Без змін |
| GET | `/api/users/:username/` | 🆕 **Явно підключено** у urls |

---

### Формат відповіді — детально задокументовано
**Чому:** Фронтенд-розробник бачить точну структуру JSON без необхідності запускати бекенд.

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/shots/?limit=12&offset=12",
  "previous": null,
  "results": [...]
}
```
