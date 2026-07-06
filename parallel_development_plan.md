# Загальний план паралельної розробки

Бекенд та фронтенд розробляються **одночасно** різними командами/розробниками. Щоб уникнути блокувань, використовується стратегія **API-First** + **MSW (Mock Service Worker)**.

---

## Стратегія паралельної розробки

### Принципи

- **API Contract First** — до початку кодування обидві сторони погоджують структуру запитів і відповідей
- **MSW на фронтенді** — поки бекенд не готовий, фронтенд працює з мок-відповідями через MSW
- **Фазова синхронізація** — обидві сторони рухаються по однакових фазах і зустрічаються на точках інтеграції

### Інструменти координації

| Інструмент                    | Призначення                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| **OpenAPI / Swagger**         | Погодження API контракту (генерується через `drf-spectacular`) |
| **MSW (Mock Service Worker)** | Фронтенд симулює API-відповіді в браузері                      |
| **Postman / Bruno**           | Тестування живого API бекенду                                  |
| **CORS**                      | Налаштовується на бекенді з першого дня                        |

---

## Фаза 0: Узгодження API Контракту (спільно, до старту)

> ⚠️ Обов'язкова передумова перед початком паралельної розробки.

### Що потрібно узгодити:

**Auth:**

- `POST /api/auth/register/` — тіло запиту / відповідь
- `POST /api/auth/login/` — формат JWT відповіді
- `POST /api/auth/google/` — формат Google ID Token
- `GET /api/auth/profile/` — структура об'єкту User
- `PATCH /api/auth/profile/` — які поля можна змінити

**Shots:**

- `GET /api/shots/` — структура Shot, пагінація (поля `next`, `results`)
- `POST /api/shots/` — multipart/form-data або JSON + окремий upload?
- `GET /api/shots/:id/` — детальний Shot з автором та тегами
- `PATCH/DELETE /api/shots/:id/`

**Social:**

- `POST /api/shots/:id/like/` — відповідь після лайку
- `GET /api/shots/:id/comments/` — структура коментаря
- `POST /api/shots/:id/comments/`
- `POST /api/users/:id/follow/`
- `GET /api/search/?q=` — формат результатів

### Виходи Фази 0:

- [ ] OpenAPI схема (або хоча б JSON-приклади для кожного ендпоінту)
- [ ] Погоджений формат пагінації
- [ ] Погоджений формат помилок (`{ "detail": "..." }` або `{ "error": "..." }`)
- [ ] CORS налаштовано на бекенді для `localhost:5173`

---

## Фаза 1: Налаштування та Авторизація

### 🔵 Бекенд

- Налаштування Django + PostgreSQL + DRF
- Custom User Model
- JWT аутентифікація (`/register/`, `/login/`, `/token/refresh/`)
- Google OAuth
- `GET/PATCH /api/auth/profile/`
- Базова документація через `drf-spectacular`

### 🟢 Фронтенд

- Ініціалізація проєкту Vite + React + TypeScript
- Роутинг (React Router v7 Data Mode)
- UI Kit: Button, Input, базові компоненти
- Header / Footer / Layout
- Axios клієнт + JWT interceptors
- Zustand `authStore` + TanStack Query v5
- **MSW моки для Auth API** (поки бекенд не готовий)
- Верстка сторінок Login / Register / Profile

### ✅ Точка інтеграції (кінець Фази 1)

- Фронтенд перемикає MSW → реальний бекенд
- Тест: реєстрація → логін → перегляд профілю → редагування

---

## Фаза 2: Shots та Feed

**Тривалість:** ~1 тиждень

### 🔵 Бекенд

- Модель `Shot` з полями та тегами
- Інтеграція Cloudflare R2 для зберігання файлів
- CRUD Shots API (`POST`, `GET`, `PATCH`, `DELETE`)
- Глобальний Feed з пагінацією

### 🟢 Фронтенд

- Компонент `ShotCard`
- Головна сторінка Feed (grid layout + infinite scroll)
- Сторінка завантаження Shot (форма + drag & drop)
- Детальна сторінка Shot
- **MSW моки для Shots API**

### ✅ Точка інтеграції (кінець Фази 2)

- Тест: завантаження Shot → відображення у Feed → детальна сторінка

---

## Фаза 3: Соціальні Функції та Пошук

**Тривалість:** ~1 тиждень

### 🔵 Бекенд

- Моделі `Like`, `Comment`, `Follow`, `Favorite`
- API ендпоінти для соціальних взаємодій
- Пошук через `django-filter` + PostgreSQL full-text search

### 🟢 Фронтенд

- Кнопки лайку та збереження (оптимістичне оновлення)
- Секція коментарів
- Кнопка Follow / Unfollow
- Сторінка пошуку
- **MSW моки для Social API**

### ✅ Точка інтеграції (кінець Фази 3)

- Тест: лайкнути Shot → побачити зміну лічильника → підписатися на автора

---

## Фаза 4: Оптимізація та Фіналізація

**Тривалість:** ~3-5 днів

### 🔵 Бекенд

- Кешування Redis для Feed та лічильників
- Валідація та безпека (rate limiting, CORS production)
- Документація API (`drf-spectacular`)
- Тести (юніт + інтеграційні)

### 🟢 Фронтенд

- Адаптивність (Mobile First)
- Анімації (Framer Motion)
- Skeleton loaders + обробка помилок
- Видалення MSW моків, фінальна інтеграція

### ✅ Точка інтеграції (кінець Фази 4)

- Повне наскрізне тестування всіх flow
- Перевірка на мобільних пристроях

---

## Налаштування MSW на фронтенді

MSW дозволяє фронтенду працювати незалежно від бекенду, перехоплюючи HTTP-запити на рівні Service Worker.

### Встановлення

```bash
npm install msw@latest --save-dev
npx msw init public/ --save
```

### Структура моків `src/mocks/`

```
src/mocks/
├── handlers/
│   ├── auth.ts      # /register, /login, /profile
│   ├── shots.ts     # /shots, /shots/:id
│   └── social.ts    # /like, /comments, /follow
├── browser.ts       # для браузера (Vite dev)
└── index.ts
```

### Приклад хендлера `src/mocks/handlers/auth.ts`

```ts
import { http, HttpResponse } from "msw";

export const authHandlers = [
  http.post("/api/auth/login/", () =>
    HttpResponse.json({
      access: "mock-access-token",
      refresh: "mock-refresh-token",
      user: {
        id: 1,
        email: "test@example.com",
        username: "designer",
        avatar: null,
      },
    }),
  ),

  http.get("/api/auth/profile/", () =>
    HttpResponse.json({
      id: 1,
      email: "test@example.com",
      username: "designer",
      bio: "UI/UX Designer",
      avatar: null,
      website: "",
    }),
  ),
];
```

### Підключення в `src/mocks/browser.ts`

```ts
import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { shotsHandlers } from "./handlers/shots";
import { socialHandlers } from "./handlers/social";

export const worker = setupWorker(
  ...authHandlers,
  ...shotsHandlers,
  ...socialHandlers,
);
```

### Увімкнення тільки в development `src/main.tsx`

```ts
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(...)
})
```

### Змінна в `.env`

```env
VITE_USE_MOCKS=true   # увімкнути MSW моки
# VITE_USE_MOCKS=false  # вимкнути, використовувати реальний API
```

---

## Зведена таблиця синхронізації

| Фаза  | Бекенд                       | Фронтенд                                | Точка інтеграції     |
| ----- | ---------------------------- | --------------------------------------- | -------------------- |
| **0** | Узгодження API контракту     | Узгодження API контракту                | OpenAPI схема        |
| **1** | Auth API + профіль           | Auth UI + MSW моки                      | Login / Profile flow |
| **2** | Shots CRUD + Feed            | ShotCard + Feed + Upload                | Публікація Shot      |
| **3** | Social + Search API          | Лайки / Follow / Пошук                  | Соціальні взаємодії  |
| **4** | Redis + тести + документація | Mobile + анімації + фінальна інтеграція | Повний E2E тест      |
