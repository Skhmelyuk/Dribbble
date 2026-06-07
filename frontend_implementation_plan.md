# План реалізації для Frontend (React, TypeScript)

Цей план сфокусований на створенні мінімально життєздатного продукту (MVP), використовуючи рекомендований технологічний стек.

> ❌ Бекенд і фронтенд розробляються **паралельно**. Дивись `parallel_development_plan.md` для загальної координації, API контракту та точок інтеграції.

**Технології:** React, TypeScript, Tailwind CSS / Material UI, Framer Motion, Zustand, TanStack Query

**Зона відповідальності:** Верстка, інтеграція з API, UI-логіка, адаптивність.

## Фази (Etap) vs Загальний план

| Цей файл | Відповідна фаза |
|---|---|
| Етап 1: Налаштування + UI Kit | Фаза 1 загального плану |
| Етап 2: Auth + Профіль | Фаза 1 загального плану |
| Етап 3: Shots + Feed | Фаза 2 загального плану |
| Етап 4: Social + Пошук | Фаза 3 загального плану |
| Етап 5: Полірування | Фаза 4 загального плану |

---


## Етап 1: Налаштування Проєкту та Дизайн-Система (UI Kit)

### 1.1. Ініціалізація та Структура
- Створення проєкту (Vite або Next.js) з підтримкою React та TypeScript
- Налаштування базової структури папок (`components`, `pages`, `hooks`, `api`, `types`)
- **Технології:** React, TypeScript

### 1.2. Роутинг
- Налаштування React Router Dom для основних сторінок:
  - `/login` — сторінка логіну
  - `/register` — сторінка реєстрації
  - `/feed` — головна стрічка
  - `/profile/:id` — профіль користувача
  - `/shot/:id` — детальна сторінка роботи
  - `/upload` — завантаження нової роботи
- **Технології:** React Router Dom

### 1.3. Стилізація та UI Kit
- Інтеграція Tailwind CSS або Material UI
- Створення базових компонентів Design System:
  - Кнопки (primary, secondary, icon)
  - Інпути та форми
  - Кольорова палітра та типографіка
- **Технології:** Tailwind CSS / Material UI

### 1.4. Базовий Layout
- Створення статичних компонентів `Header` та `Footer`
- Header включає: логотип, кнопки авторизації або аватар авторизованого користувача

### 1.5. HTTP Клієнт
- Налаштування Axios для взаємодії з бекенд API
- Налаштування базового URL, interceptors для додавання JWT у заголовки
- **MSW (Mock Service Worker)** — перехоплює HTTP-запити в браузері, дозволяє діяти незалежно від бекенду
- Деталі MSW налаштування: `parallel_development_plan.md`
- **Технології:** Axios, MSW

### 1.6. Стейт Менеджмент

Використовуємо два інструменти з різною зоною відповідальності:

- **Zustand** — для глобального клієнтського стейту (авторизований користувач, стан UI)
- **TanStack Query** — для серверного стейту (дані з API: shots, коментарі, профілі)

#### Чому саме ці інструменти?

| | Zustand | TanStack Query |
|---|---|---|
| **Для чого** | Auth стейт, модалки, теми | Кешування та синхронізація даних API |
| **Переваги** | Мінімальний boilerplate, без Provider | Автокешування, `isLoading`/`isError`, рефетч |
| **Альтернатива** | Context + useReducer | useEffect + useState (ручне) |

#### Zustand — приклад auth store

```ts
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  username: string
  avatar: string | null
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' } // зберігається в localStorage
  )
)
```

#### TanStack Query — приклад запиту feed

```ts
// src/hooks/useShots.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

// Infinite scroll для feed
export const useFeed = () =>
  useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => api.getShots({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

// Лайк із автоматичним оновленням лічильника
export const useLikeShot = (shotId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.likeShot(shotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] })
    },
  })
}
```

- **Технології:** Zustand, TanStack Query

---

## Етап 2: Аутентифікація та Користувач

### 2.1. UI Реєстрації / Логіну
- Верстка сторінки реєстрації та логіну
- Форма з полями `email` / `password`
- Кнопка для входу через Google OAuth
- **API:** —

### 2.2. Інтеграція Auth
- Обробка форм, відправка даних на API (`/register`, `/login`)
- Зберігання JWT токенів (localStorage / httpOnly cookie)
- Логіка оновлення `refresh` токену
- Створення захищеного роутингу (через `loader` в React Router v7)
- **MSW мок:** працює до першої інтеграції з бекендом
- **API:** `Users API`

### 2.3. Сторінка Профілю (Відображення)
- Верстка сторінки профілю:
  - Аватар, ім'я, Bio
  - Соціальні посилання
  - Список робіт користувача (Shot Cards)
- Запит даних з API при завантаженні сторінки
- **API:** `Users API`

### 2.4. Редагування Профілю
- Модальне вікно або окрема сторінка для редагування
- Поля: Bio, соціальні посилання
- Завантаження нового аватара (file input + preview)
- **API:** `Users API`

---

## Етап 3: Роботи (Shots) та Стрічка (Feed)

### 3.1. Компонент Shot Card
- Компонент для відображення прев'ю роботи у стрічці
- Включає: зображення, назву, ім'я автора, лічильник лайків
- Hover-ефект з кнопками "Лайк" та "Зберегти"
- **API:** —

### 3.2. Головна сторінка (Feed)
- Верстка макету стрічки (grid / masonry layout)
- Завантаження глобального feed з API
- Плавна прокрутка та пагінація (infinite scroll або кнопка "Завантажити більше")
- **API:** `Feed API`

### 3.3. Сторінка Завантаження Роботи
- Форма для публікації нового Shot:
  - Поля: назва, опис
  - Вибір тегів
  - Інтерфейс для завантаження зображення / прев'ю (drag & drop або file input)
- **API:** `Shots API`

### 3.4. Детальна сторінка Shot
- Верстка повної сторінки роботи:
  - Велике зображення
  - Інформація про автора з кнопкою Follow
  - Опис та теги
  - Секція коментарів
- **API:** `Shots API`

---

## Етап 4: Взаємодія (Social) та Пошук (MVP)

### 4.1. Лайки та Збереження
- UI-логіка для кнопок "Лайк" та "Зберегти" (Favorites)
- Оптимістичне оновлення UI (зміна стану до відповіді сервера)
- Відправка запитів на бекенд та оновлення лічильників
- **API:** `Likes / Social API`

### 4.2. Коментарі
- Компонент відображення списку коментарів
- Форма для додавання нового коментаря
- Відображення аватара та імені автора коментаря
- **API:** `Comments API`

### 4.3. Підписки
- Кнопка "Follow / Unfollow" на сторінці профілю та детальній сторінці Shot
- Обробка підписки та відписки із зміною стану кнопки
- **API:** `Follows API`

### 4.4. Пошукова Сторінка
- Верстка сторінки пошуку
- Поле введення пошукового запиту
- Відображення результатів: роботи та користувачі
- **API:** `Search API`

---

## Етап 5: Полірування та Нефункціональні Вимоги

### 5.1. Адаптивність
- Коректне відображення всіх ключових сторінок на мобільних, планшетах та десктопах
- Підхід **Mobile First**
- Сторінки: Feed, Профіль, Shot, Auth, Пошук

### 5.2. Мінімальні Анімації
- Використання **Framer Motion** для:
  - Переходів між сторінками
  - Hover-ефектів на картках Shot
  - Появи модальних вікон
- **Технології:** Framer Motion

### 5.3. Обробка Помилок та Завантаження
- Індикатори завантаження (spinner / skeleton screens)
- Дружні повідомлення про помилки при невдалих API-запитах
- Fallback-стани для порожніх списків (пустий feed, немає коментарів)
