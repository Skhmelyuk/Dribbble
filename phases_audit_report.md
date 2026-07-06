# Аудит специфікацій та планів розробки (Фази 0–3) — Voxel

> **СТАТУС: УСІ НЕСТИКОВКИ ТА ПОМИЛКИ УСПІШНО ВИПРАВЛЕНО (ОНОВЛЕНО 2026-07-06)**  
> Нижчеописані проблеми були проаналізовані та виправлені безпосередньо у відповідних `.md` файлах специфікацій для повної узгодженості між командами фронтенду та бекенду.

---

## 1. Критичні архітектурні нестиковки

### 1.1. Відновлення пароля: OTP (6 цифр) vs Токен посилання (uid + token)
* **Проблема:** 
  * У **[phase_1_frontend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_1_frontend.md#L502-L509)** описано інтерфейс сторінки підтвердження скидання пароля `ForgotPasswordConfirmPage.tsx` з введенням **OTP-коду (6 цифр)**.
  * У **[phase_1_backend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_1_backend.md#L267-L271)** для відновлення підключено стандартний `dj-rest-auth.urls`. Проте, стандартний Django-механізм скидання пароля відправляє на пошту **довге посилання** з унікальним ідентифікатором користувача (`uid`) та криптографічним токеном (`token`). Ендпоїнт `POST /api/auth/password/reset/confirm/` очікує саме `{ uid, token, new_password1, new_password2 }`.
* **Наслідок:** Фронтенд не зможе відправити валідний запит на бекенд, використовуючи лише 6-значний OTP-код.
* **Рішення (на вибір):**
  * **Варіант А (Рекомендований):** Змінити логіку на фронтенді. Користувач отримує на пошту посилання виду `http://localhost:5173/forgot-password/confirm?uid=...&token=...`. При переході фронтенд зчитує параметри з URL та показує лише поля для введення нового пароля (без OTP-поля).
  * **Варіант Б:** На бекенді написати кастомний `PasswordResetView`, який генерує 6-значний код, записує його в базу/Redis і валідує на другому кроці.

### 1.2. Пагінація списку коментарів: Об'єкт vs Плоский масив
* **Проблема:**
  * У **[phase_0_api_contract.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_0_api_contract.md#L354-L375)** зазначено, що `GET /api/shots/:id/comments/` повертає **пагіновану структуру**:
    `{ "count": 14, "next": null, "previous": null, "results": [...] }`
  * У **[phase_3_backend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_3_backend.md#L227-L230)** у коді `comments` метод повертає **чистий масив**: `return Response(serializer.data)`.
  * У **[phase_3_frontend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_3_frontend.md#L64)** фронтенд також очікує плоский масив: `api.get<Comment[]>(...)` та безпосередньо мапить його в UI (`comments.map(...)`).
* **Наслідок:** Якщо бекенд вирішить слідувати Фазі 0 (зробить відповідь пагінованою через DRF pagination), фронтенд впаде з помилкою `comments.map is not a function`, оскільки отримає об'єкт замість масиву.
* **Рішення:** Погодити єдиний формат. Для коментарів під окремим Shot зазвичай достатньо плоского масиву (без пагінації). Потрібно оновити `phase_0_api_contract.md` відповідно до реального коду Фази 3.

### 1.3. Автоматична пагінація списків підписників (Followers / Following)
* **Проблема:**
  * У **[phase_3_backend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_3_backend.md#L290-L308)** класи `FollowersListView` та `FollowingListView` наслідуються від `generics.ListAPIView`.
  * Якщо в Django REST Framework увімкнено глобальну пагінацію в `settings.py` (що необхідно для стрічки Shots), то `ListAPIView` автоматично загорне список підписників у пагінований об'єкт `{ count, next, previous, results }`.
  * У **[phase_3_frontend.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_3_frontend.md#L82-L85)** фронтенд очікує плоский масив `FollowUser[]`.
* **Наслідок:** Збій рендерингу списку підписників у модальному вікні на фронтенді.
* **Рішення:** На бекенді у класах `FollowersListView` та `FollowingListView` явно вимкнути пагінацію:
  ```python
  class FollowersListView(generics.ListAPIView):
      pagination_class = None
      # ...
  ```

---

## 2. Невідповідності в API-контрактах та параметрах

### 2.1. Ідентифікація користувача: ID vs Username
* **Проблема:**
  * У **[phase_0_api_contract.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_0_api_contract.md#L394-L424)** для соціальних дій та публічного профілю використовуються числові ідентифікатори:
    * `POST /api/users/:id/follow/`
    * `GET /api/users/:id/`
  * У реальній реалізації Фаз 1–3 скрізь використовуються рядкові `username`:
    * Бекенд: `path('<str:username>/follow/', ...)`
    * Фронтенд: `/profile/:username`, `toggleFollow: (username: string) => ...`
* **Наслідок:** Логічна невідповідність між початковим контрактом та реальним кодом.
* **Рішення:** Оновити `phase_0_api_contract.md`, щоб скрізь замість `:id` для користувачів було вказано `:username` (окрім випадків внутрішніх зв'язків у серіалізаторах).

### 2.2. Відсутність загального пошуку `/api/search/`
* **Проблема:**
  * У **[phase_0_api_contract.md](file:///home/skmelyuk/Documents/projects/Dribbble/phase_0_api_contract.md#L429-L458)** описано загальний ендпоїнт пошуку `GET /api/search/?q=`, який повертає розділені результати для `shots` та `users`.
  * У планах розробки Фази 2 та 3 цей ендпоїнт **повністю відсутній** на бекенді. Пошук реалізовано лише локально для робіт: `GET /api/shots/?search=query`.
* **Наслідок:** Якщо у дизайні є глобальний пошук (включаючи пошук дизайнерів), він не працюватиме.
* **Рішення:** Якщо пошук користувачів не потрібен на поточному етапі, видалити цей розділ з контракту. Якщо потрібен — додати створення `SearchView` на бекенді.

---

## 3. Технічні помилки та баги в коді специфікацій

### 3.1. Синтаксична помилка імпорту в `apps/users/urls.py`
* **Де:** **[phase_1_backend.md:L270](file:///home/skmelyuk/Documents/projects/Dribbble/phase_1_backend.md#L270)** та **[phase_3_backend.md:L316-L325](file:///home/skmelyuk/Documents/projects/Dribbble/phase_3_backend.md#L316-L325)**.
* **Помилка:** Використовується функція `include()`, але вона не імпортована:
  ```python
  from django.urls import path # Немає include!
  ```
* **Рішення:** Замінити імпорт на `from django.urls import path, include`.

### 3.2. Дублювання шляху для `dj-rest-auth.urls`
* **Де:** **[phase_1_backend.md:L270](file:///home/skmelyuk/Documents/projects/Dribbble/phase_1_backend.md#L270)**.
* **Помилка:** Шлях прописано як `path('password/reset/', include('dj_rest_auth.urls'))`.
  * Всередині `dj_rest_auth.urls` вже є свої відносні шляхи: `password/reset/` та `password/reset/confirm/`.
  * При такому монтуванні кінцевий URL стане `/api/auth/password/reset/password/reset/`.
* **Рішення:** Монтувати `dj-rest-auth.urls` у корінь або використовувати окремі імпортовані View:
  ```python
  from dj_rest_auth.views import PasswordResetView, PasswordResetConfirmView
  
  # В urls.py:
  path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
  path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
  ```

### 3.3. Передача тегів при публікації (Comma separated vs Array)
* **Де:** **[phase_2_frontend.md:L881](file:///home/skmelyuk/Documents/projects/Dribbble/phase_2_frontend.md#L881)** та **[phase_2_backend.md:L120](file:///home/skmelyuk/Documents/projects/Dribbble/phase_2_backend.md#L120)**.
* **Помилка:**
  * Фронтенд робить `formData.append('tags', tags.join(','))`, тобто передає теги одним рядком: `"ui,design,mobile"`.
  * Бекенд використовує `TagRelatedField(many=True)`, який очікує ітерабельний список елементів (масив). При отриманні рядка DRF або видасть помилку валідації (`Expected a list of items but got type "str"`), або розіб'є рядок посимвольно.
* **Рішення:** Змінити передачу на фронтенді, додаючи кожен тег окремо в `FormData`:
  ```typescript
  tags.forEach(tag => formData.append('tags', tag));
  ```
  У такому випадку Django отримає список значень для ключа `tags`, що є стандартним для `many=True` полів у `multipart/form-data`.
