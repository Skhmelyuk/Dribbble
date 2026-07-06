# Changelog: phase_1_frontend.md — Що було скориговано

> Підстава для змін: аналіз дизайну Figma (design_analysis.md)

---

## ✅ Що залишилось без змін

- Технологічний стек (React + TS + Tailwind v4 + Zustand + TanStack Query + MSW)
- `authStore.ts` (persist, setAuth, updateUser, logout)
- Axios клієнт з JWT interceptors
- `LoginPage` (структура)
- `RegisterPage` (структура)
- `Button.tsx` та `Input.tsx` компоненти

---

## 🆕 Що було ДОДАНО

### 1. Сторінка `ForgotPasswordPage` (`/forgot-password`)

**Чому:** У Figma є фрейм "Recovery password" — окрема сторінка.  
**Компоненти:** Logo, email input, "Send recovery code" button, посилання "Back to Sign in"  
**API:** `POST /api/auth/password/reset/`

---

### 2. Сторінка `ForgotPasswordConfirmPage` (`/forgot-password/confirm`)

**Чому:** У Figma є фрейм "Recovery password / Confirm it's you" — підтвердження коду з email.  
**Компоненти:** Текст "We've sent you a passcode", OTP/code input, "Continue" button, "Resend code" link  
**API:** `POST /api/auth/password/reset/confirm/`

---

### 3. Сторінка `SettingsPage` (`/settings`)

**Чому:** У Figma є окремий фрейм "Settings" — налаштування акаунту.  
**Компоненти:**

- `AvatarUploader` — аватар + кнопка зміни
- Поля профілю: username (disabled), email (disabled), bio textarea
- Social links: website, twitter, instagram, linkedin
- Секція зміни паролю (old + new + confirm)  
  **API:** `PATCH /api/auth/profile/`, `POST /api/auth/password/change/`

---

### 4. Компонент `Logo.tsx`

**Чому:** У дизайні є лого "Voxel" з кольоровою іконкою-спіраллю — виведено в окремий компонент для переиспользування на auth сторінках та в Navbar.

---

### 5. Компонент `Avatar.tsx`

**Чому:** Аватар з fallback (ui-avatars) — використовується в Navbar, ShotCard, ProfilePage.

---

### 6. Navbar (`src/components/layout/Navbar.tsx`)

**Чому:** У дизайні Figma хедер є на всіх основних сторінках з різним станом для гостя та авторизованого.  
**Стан для гостя:** Sign in + Sign up кнопки  
**Стан для авторизованого:** Upload кнопка + Avatar (з dropdown: Profile, Settings, Logout)  
**Дані з store:** `user.avatar`, `user.username` із Zustand

---

### 7. Оновлений роутинг

**Що змінилось:**

| Маршрут                    | Було                | Стало                                       |
| -------------------------- | ------------------- | ------------------------------------------- |
| `/`                        | redirect → `/login` | redirect → `/feed`                          |
| `/forgot-password`         | ❌ немає            | 🆕 `ForgotPasswordPage`                     |
| `/forgot-password/confirm` | ❌ немає            | 🆕 `ForgotPasswordConfirmPage`              |
| `/settings`                | частина ProfilePage | 🆕 окрема захищена сторінка                 |
| `/profile`                 | `/profile` (своя)   | перенесено у Фазу 2 як `/profile/:username` |

---

### 8. Нові MSW Handlers

| Handler                                  | Було | Стало                                                   |
| ---------------------------------------- | ---- | ------------------------------------------------------- |
| `POST /api/auth/password/change/`        | ❌   | 🆕 Мок повертає `{ detail: "Пароль успішно змінено." }` |
| `POST /api/auth/password/reset/`         | ❌   | 🆕 Мок повертає `{ detail: "Інструкції надіслано." }`   |
| `POST /api/auth/password/reset/confirm/` | ❌   | 🆕 Мок повертає успіх                                   |
| `GET /api/users/:username/`              | ❌   | 🆕 Публічний профіль (без email)                        |

---

### 9. Типи (`src/types/user.ts`)

**Що додано:** `PublicUser` інтерфейс (без email, з `is_following`):

```typescript
export interface PublicUser {
  id: number;
  username: string;
  avatar: string | null;
  bio: string;
  website: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  shots_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}
```

---

## 🔄 Що було ЗМІНЕНО

### Структура директорій

- **Було:** `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`
- **Стало:** `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx` (підпапка `auth/`)

### Auth сторінки — стилізація

- **Було:** темний glassmorphism (`bg-surface-alt`, `border-border`, `text-white`) — Tailwind dark теми
- **Стало:** світлий glassmorphism (`bg-white/40`, `backdrop-blur-xl`, `border-white/60`) — відповідно до скріншотів Figma (світла тема з розмитим природним фоном)

### Button variants

- **Було:** `primary` (рожевий `#EA4C89`), `secondary`, `ghost`
- **Стало:** додано `google` variant для кнопки OAuth; primary тепер teal (`bg-teal-700`) відповідно до Figma
