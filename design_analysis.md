# Аналіз Дизайну Figma — Voxel (Dribbble Clone)

> Джерело: https://www.figma.com/design/yg2hxi3xav6huAKK1CTEBd/Untitled?node-id=0-1&p=f
> Назва проекту в дизайні: **Voxel**

---

## Виявлені Екрани (Frames у Figma)

З layers-панелі та скріншотів Figma виявлено наступні основні фрейми:

| Фрейм | Маршрут | Тип |
|---|---|---|
| Sign in | `/login` | Guest only |
| Sign in / Confirm it's you | `/login` (2FA step) | Guest only |
| Sign up | `/register` | Guest only |
| Recovery password | `/forgot-password` | Guest only |
| Recovery password / Confirm it's you | `/forgot-password/confirm` | Guest only |
| main | `/feed` | Public |
| main (shot detail view) | `/shot/:id` | Public |
| Personal profile / Work | `/profile/:username` | Public |
| Personal profile / Liked | `/profile/:username/liked` | Auth only (own) |
| Settings | `/settings` | Auth only |
| Upload (немає frame, але є у flow) | `/upload` | Auth only |

---

## Детальний Розбір Компонентів по Екранах

### 1. Sign In Page (`/login`)

**Дані від бекенду:** немає (форма)

**UI Компоненти:**
- Фоновий пейзажний image (статичний asset)
- Glassmorphism карточка по центру (blur + white/20 background)
- `<Logo />` — лого "Voxel" з іконкою зверху
- `<GoogleOAuthButton />` — кнопка "Login with Google account"
- Роздільник "or"
- `<Input type="email" />` — "Enter email address"
- `<Input type="password" />` — "Enter your password"
- `<Button primary />` — "Continue"
- Disclaimer text: "By continuing, you agree to our Terms and Privacy Policy."
- Link: "Already have an account? Sign up" → `/register`

**API Endpoints (Фаза 1):**
- `POST /api/auth/login/` → `{ email, password }` → `{ access, refresh }`
- `POST /api/auth/google/` → `{ token }` → `{ access, refresh, created }`

---

### 2. Sign Up Page (`/register`)

**Дані від бекенду:** немає (форма)

**UI Компоненти:**
- Той самий glassmorphism layout що і Sign In
- `<Logo />`
- `<GoogleOAuthButton />` — "Sign up with Google"
- Роздільник "or"
- `<Input type="text" />` — username / full name
- `<Input type="email" />`
- `<Input type="password" />`
- `<Input type="password" />` — confirm password
- `<Button primary />` — "Create account"
- Link: "Already have an account? Sign in" → `/login`

**API Endpoints (Фаза 1):**
- `POST /api/auth/register/` → `{ email, username, password, password2 }`

---

### 3. Recovery Password (`/forgot-password`)

**UI Компоненти:**
- Glassmorphism layout
- `<Logo />`
- `<Input type="email" />` — "Enter your email"
- `<Button primary />` — "Send recovery code"
- Link: "Back to Sign in"

**Recovery Confirm (`/forgot-password/confirm`):**
- Поле вводу коду (OTP/passcode: "We've sent you a passcode. Please check your inbox.")
- "Resend code" link
- `<Button primary />` — "Continue"

**API Endpoints (Фаза 1):**
- `POST /api/auth/password/reset/` → `{ email }`
- `POST /api/auth/password/reset/confirm/` → `{ uid, token, new_password }`

---

### 4. Main Feed Page (`/feed`)

**Дані від бекенду:** список shots з пагінацією

**Layout Компоненти:**
- `<Navbar />` — верхній хедер з лого, навігацією, аватаром
  - Містить: лого, search input, links (Inspiration, Find work, Learn), CTA кнопки (Upload, Log in/Profile)
- `<FilterBar />` — горизонтальний рядок тегів/категорій для фільтрації
- `<ShotsGrid />` — masonry або рівна сітка карток shots
- `<ShotCard />` — картка з hover overlay
- `<InfiniteScrollTrigger />` — invisible div + IntersectionObserver

**`<ShotCard />` містить:**
- Зображення (preview) з aspect-ratio
- Hover overlay: назва + Like/Save кнопки
- Footer: аватар автора, ім'я автора, лічильник лайків

**Дані з API для `ShotCard`:**
```json
{
  "id": 1,
  "title": "string",
  "preview": "url",
  "image": "url",
  "tags": ["string"],
  "author": {
    "id": 1,
    "username": "string",
    "avatar": "url | null"
  },
  "likes_count": 0,
  "comments_count": 0,
  "is_liked": false,
  "is_saved": false,
  "created_at": "datetime"
}
```

**API Endpoints (Фаза 2):**
- `GET /api/shots/?limit=12&offset=0&search=...&tags=...` → `{ count, next, previous, results[] }`

---

### 5. Shot Detail Page (`/shot/:id`)

**Дані від бекенду:** один shot + коментарі

**UI Компоненти:**
- `<Navbar />`
- Велике зображення (full-width або centered, max-height обмежений)
- `<ShotHeader />`:
  - Назва роботи (h1)
  - Автор: аватар + username + дата
  - Кнопки: Like (з лічильником), Save, Share
  - Якщо поточний user є автором: Edit/Delete кнопки
- `<ShotDescription />` — текстовий опис
- `<TagsList />` — теги-бейджики з посиланнями на фільтровану стрічку
- `<CommentsSection />` (Фаза 3):
  - Список коментарів
  - Форма додавання коментаря (тільки авторизованим)

**API Endpoints:**
- `GET /api/shots/:id/` → `Shot`
- `POST /api/shots/:id/like/` → toggle like (Фаза 3)
- `POST /api/shots/:id/save/` → toggle save (Фаза 3)
- `GET /api/shots/:id/comments/` (Фаза 3)
- `POST /api/shots/:id/comments/` (Фаза 3)

---

### 6. Personal Profile Page (`/profile/:username`)

**З Figma видно дві вкладки: "Work" і "Liked"**

**UI Компоненти:**
- `<Navbar />`
- `<ProfileHeader />`:
  - Великий аватар (округлений)
  - Username (h1)
  - Bio текст
  - Соціальні посилання: Website, Twitter/X, Instagram, LinkedIn (icons row)
  - Stats row: `N shots`, `N followers`, `N following`
  - Кнопки: "Follow" (якщо чужий профіль) / "Edit Profile" (якщо свій)
- `<ProfileTabs />` — "Work" / "Liked" вкладки
- `<ShotsGrid />` — та ж сітка карток, відфільтрована по автору або лайках

**Дані з API для профілю:**
```json
{
  "id": 1,
  "username": "string",
  "avatar": "url | null",
  "bio": "string",
  "website": "url",
  "twitter": "url",
  "instagram": "url",
  "linkedin": "url",
  "shots_count": 0,
  "followers_count": 0,
  "following_count": 0,
  "is_following": false
}
```

**API Endpoints (Фаза 2 + 3):**
- `GET /api/users/:username/` → `UserProfile`
- `GET /api/shots/?author=:id` → shots автора (Фаза 2)
- `GET /api/users/:username/liked/` → лайкнуті shots (Фаза 3)
- `POST /api/users/:username/follow/` → toggle follow (Фаза 3)

---

### 7. Settings Page (`/settings`)

**З Figma видно форму налаштувань акаунту**

**UI Компоненти:**
- `<Navbar />`
- `<SettingsLayout />` з можливою бічною навігацією або вкладками:
  - Profile info
  - Account (email, password)
  - Social links
- `<AvatarUploader />` — аватар + кнопка зміни
- Поля: username (read-only), email (read-only?), bio textarea
- Social links inputs: website, twitter, instagram, linkedin
- `<Button primary />` — "Save changes"
- Секція зміни паролю (окремо)

**API Endpoints (Фаза 1):**
- `GET /api/auth/profile/` → поточний профіль
- `PATCH /api/auth/profile/` → оновлення (multipart/form-data)
- `POST /api/auth/password/change/` → зміна паролю (Фаза 1 або 2)

---

### 8. Upload Page (`/upload`)

**З Фази 2 documents + логіки Figma**

**UI Компоненти:**
- `<Navbar />`
- Drag & Drop зона для зображення (або video preview)
- `<Input />` — "Shot title"
- `<Textarea />` — "Description"  
- `<TagsInput />` — додавання тегів через Enter/кому
- `<Button primary />` — "Publish"

**API Endpoints (Фаза 2):**
- `POST /api/shots/` → multipart/form-data → `Shot`

---

## Спільні Компоненти (Shared UI)

| Компонент | Де використовується |
|---|---|
| `<Navbar />` | Всі protected/public сторінки |
| `<Logo />` | Navbar + Auth сторінки |
| `<Button />` | Всюди |
| `<Input />` | Auth forms, Settings, Upload |
| `<ShotCard />` | Feed, Profile tabs |
| `<ShotsGrid />` | Feed, Profile |
| `<Avatar />` | Navbar, ShotCard, Profile |
| `<TagBadge />` | ShotCard hover, Shot detail, Upload |
| `<LoadingSpinner />` | Всі async стани |
| `<EmptyState />` | Feed (немає shots), Profile (порожня вкладка) |

---

## Navbar Компонент — детально

З Figma на main feed видно Navbar з:
- **Ліворуч**: Лого "Voxel"  
- **По центру**: Search input (глобальний пошук), навігаційні посилання
- **Праворуч (неавторизований)**: "Sign in" / "Sign up" кнопки
- **Праворуч (авторизований)**: Кнопка "Upload", аватар (dropdown меню → Profile, Settings, Logout)

**Дані що потрібні Navbar:**
- `user.avatar`, `user.username` — із Zustand auth store

---

## Висновки для Корекції Фаз

### Що ДОДАТИ до Фази 1 (Auth):
1. **Recovery Password flow** — endpoints `POST /api/auth/password/reset/` та `POST /api/auth/password/reset/confirm/`
2. **Сторінки** `/forgot-password` та `/forgot-password/confirm` на фронтенді
3. **Password change** endpoint для Settings — `POST /api/auth/password/change/`
4. **Публічний endpoint профілю** — `GET /api/users/:username/` (не тільки свій профіль)
5. Поле `shots_count`, `followers_count`, `following_count` вже у UserProfileSerializer

### Що ДОДАТИ до Фази 2 (Shots/Feed):
1. **`GET /api/users/:username/`** — публічна сторінка профілю (або окремий endpoint)
2. **Profile page** з двома вкладками Work/Liked (liked — заглушка для Фази 3)
3. **Settings page** (перенести з Фази 1 або розширити)
4. **`Navbar` компонент** з пошуком та аватаром
5. **Shot detail page** з повноцінним відображенням

### Нова Фаза 3 (Interactions):
1. **Like/Unlike** — `POST /api/shots/:id/like/`
2. **Save/Unsave** — `POST /api/shots/:id/save/`
3. **Follow/Unfollow** — `POST /api/users/:username/follow/`
4. **Comments** — CRUD для `GET/POST /api/shots/:id/comments/`
5. **Liked shots tab** у профілі — `GET /api/users/:username/liked/`
6. **Followers/Following** — `GET /api/users/:username/followers/`
