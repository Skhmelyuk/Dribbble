# Voxel — Dribbble Clone (Frontend)

Сучасний фронтенд для клона Dribbble під назвою **Voxel**, розроблений з урахуванням специфікацій Фази 1.

## Стек технологій

| Технологія              | Версія      |
|-------------------------|-------------|
| React                   | ^19         |
| TypeScript              | ~5.8        |
| Tailwind CSS            | ^4.3        |
| React Router            | ^7.17       |
| TanStack Query (React Query) | ^5     |
| Zustand                 | ^5          |
| Axios                   | ^1.9        |
| MSW (Mock Service)      | ^2          |

## Основні можливості (Фаза 1)

- Реєстрація та авторизація (Email + Password)
- Вхід через Google (mock)
- Захищені маршрути
- Оновлення профілю (включаючи аватар)
- Автоматичне оновлення токенів (refresh token)
- Mock Service Worker для незалежної розробки
- Повністю типізований код

## Швидкий старт

```bash
# 1. Встановлення залежностей
npm install

# 2. Ініціалізація MSW (якщо ще не зроблено)
npx msw init public/ --save

# 3. Запуск у режимі розробки
npm run dev
```

Відкрийте [http://localhost:5173](http://localhost:5173)

### Демо-акаунт

- **Email**: `designer@example.com`
- **Пароль**: `PassWord123!`

## Конфігурація (.env)

```env
# API
VITE_API_BASE_URL=http://localhost:8000/api

# Режим моків (для розробки без бекенду)
VITE_USE_MOCKS=true
```

## Структура проєкту

```
src/
├── api/                  # Axios клієнт + typed API
├── components/
│   ├── auth/             # Компоненти для сторінок авторизації
│   ├── layout/           # Layout, Navbar
│   └── ui/               # Базові UI компоненти
├── hooks/                # Кастомні React hooks
├── mocks/                # MSW handlers
├── pages/                # Сторінки (Login, Register, Profile...)
├── store/                # Zustand stores
├── types/                # TypeScript типи
├── utils/                # Утиліти (cn.ts)
├── main.tsx
├── router.tsx
└── index.css             # Tailwind + глобальні стилі
```

## Маршрути

| Шлях           | Опис                     | Доступ          |
|----------------|--------------------------|-----------------|
| `/`            | Редирект                 | -               |
| `/login`       | Сторінка входу           | Гості           |
| `/register`    | Сторінка реєстрації      | Гості           |
| `/profile`     | Особистий профіль        | Авторизовані    |


## Перехід на реальний бекенд
1. Змініть у `.env`:
   ```env
   VITE_USE_MOCKS=false
   ```
2. Перезапустіть додаток (`npm run dev`).


## Команди
```bash
npm run dev      # Розробка
npm run build    # Production build
npm run preview  # Перегляд білду
npm run lint     # Лінтер
```


## Відповідність ТЗ
- Повністю відповідає **Phase 0 API Contract** (Auth ендпоінти).
- Реалізовано згідно з **Phase 1 Frontend Specification**.
- Підтримка `multipart/form-data` для аватара.
- Правильна обробка помилок відповідно до DRF стандарту.

---
