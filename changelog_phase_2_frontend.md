# Changelog: phase_2_frontend.md — Що було скориговано

> Підстава для змін: аналіз дизайну Figma (design_analysis.md)

---

## ✅ Що залишилось без змін
- Типи `Shot`, `PaginatedResponse` (`src/types/shot.ts`)
- `shotsApi` функції (getShots, getShot, createShot, deleteShot)
- `useFeedQuery` з infinite scroll
- `useShotQuery`, `useCreateShotMutation`, `useDeleteShotMutation`
- MSW handlers для shots (list, detail, create, delete)
- `UploadPage` — drag & drop, теги, submit

---

## 🆕 Що було ДОДАНО

### 1. Сторінка `ProfilePage` (`/profile/:username`)
**Чому:** У Figma є фрейм "Personal profile" — публічна сторінка профілю будь-якого автора.  
**Замінює:** стару `ProfilePage` з Фази 1 (яка показувала тільки свій профіль через `/profile`).

**Компоненти ProfilePage:**
- `<ProfileHeader />` — аватар, username, bio, social links, stats (shots/followers/following)
- `<CTA кнопка />` — "Edit Profile" (якщо свій) або "Follow" (якщо чужий)
- `<ProfileTabs />` — вкладки "Work" / "Liked"
- `<ShotsGrid />` — shots по вкладці Work (Liked — заглушка до Фази 3)

---

### 2. `useAuthorShotsQuery` хук
**Чому:** ProfilePage завантажує shots конкретного автора — окремий хук з `?author=:id`.  
**Де:** `src/hooks/useShots.ts`

---

### 3. API файл `src/api/users.ts`
**Чому:** Потрібен окремий модуль для user-related ендпоїнтів.  
**Що містить:** `usersApi.getPublicProfile(username)` → `GET /api/users/:username/`

---

### 4. Хук `usePublicProfileQuery` (`src/hooks/useUsers.ts`)
**Чому:** ProfilePage завантажує публічний профіль через TanStack Query (кешування, стани loading/error).

---

### 5. Компонент `ShotsGrid.tsx`
**Чому:** Grid з картками використовується і у FeedPage, і у ProfilePage — винесено в окремий компонент.  
**Де:** `src/components/ui/ShotsGrid.tsx`

---

### 6. Компонент `ShotsSkeleton.tsx`
**Чому:** Анімований placeholder під час завантаження — окремий компонент замість inline JSX.  
**Де:** `src/components/ui/ShotsSkeleton.tsx`

---

### 7. Оновлений `ShotCard.tsx`
**Що додано:**
- Footer: аватар автора + username тепер є `<Link to="/profile/:username">` — клікабельний
- Like кнопка відображає `is_liked` стан (рожева якщо лайкнуто)
- Fallback аватар через `ui-avatars.com` (замість `via.placeholder.com`)

---

### 8. Оновлений роутинг
| Маршрут | Було | Стало |
|---|---|---|
| `/profile` | Protected, тільки свій профіль | ❌ Видалено з Фази 2 |
| `/profile/:username` | ❌ не було | 🆕 Public сторінка профілю |
| `/settings` | ❌ не було | 🆕 Protected (перенесено з Фази 1) |
| `/feed` | Public | ✅ Без змін |
| `/upload` | Protected | ✅ Без змін |
| `/shot/:id` | Public | ✅ Без змін |
| `/forgot-password` | ❌ | 🆕 (з Фази 1) |
| `/forgot-password/confirm` | ❌ | 🆕 (з Фази 1) |

---

### 9. `ShotDetailPage` — оновлена структура
**Що змінилось:**
- Автор тепер є `<Link to="/profile/:username">` — клікабельний
- Fallback аватар через `ui-avatars.com`
- Кнопки Like/Save — підготовлені до Фази 3 (наразі без функціоналу)
- Теги — `<Link to="/feed?tags=:tag">` для фільтрованої стрічки

---

## 🔄 Що було ЗМІНЕНО

### Стилізація — загальна тема
**Було:** темна тема (`bg-surface`, `bg-surface-alt`, `text-white`, `border-border`)  
**Стало:** світла тема (`bg-white`, `border-gray-200`, `text-gray-900`) — відповідно до скріншотів Figma

> ⚠️ Це референс. Фінальна стилізація — відповідальність розробника згідно з дизайном Figma.

---

### `FeedPage` — FilterBar
**Було:** Tailwind dark утиліти (`bg-surface-alt`, `text-muted`)  
**Стало:** світлі кольори (`bg-gray-100`, `bg-gray-900` для активного)

---

### Видалено `ProfilePage` (стара версія з Фази 1)
**Чому:** Стара сторінка показувала тільки свій профіль через `/profile` і мала форму редагування. Тепер:
- Перегляд профілю → `/profile/:username` (Фаза 2, публічна)
- Редагування профілю → `/settings` (Фаза 1, захищена)

---

## 🔵 Що залишається для Фази 3 (явні заглушки)

| Функціонал | Де заглушка |
|---|---|
| Like / Unlike shot | `ShotDetailPage`, `ShotCard` — кнопки без onClick |
| Save shot | `ShotDetailPage` — кнопка без onClick |
| Follow / Unfollow user | `ProfilePage` — кнопка "Follow" без onClick |
| Liked shots tab | `ProfilePage` — вкладка "Liked" показує текст-заглушку |
| Comments | `ShotDetailPage` — розділу немає |
| Notifications | Navbar — іконки немає |
