#  4:   ,  , ,    ( )

>  : React + TypeScript + Tailwind CSS v4.3  
> :  1, 2  3     .

---

##    

|   |  |
|---|---|
| Адаптивність (Mobile First) | Оптимізація інтерфейсу для смартфонів та планшетів |
| Анімації та мікро-взаємодії | Плавні ховери, переходи між сторінками та реакція кнопок |
| Скелетони та обробка помилок | Покращення завантаження (UX) та перехоплення помилок мережі |
| Підготовка до продакшну | Вимкнення MSW, збірка проєкту та валідація бандлу |

---

## 1. Адаптивність (Mobile First) через Tailwind CSS v4.3

Весь макет має коректно відображатися на екранах від 320px до 1440px.

### 1.1. Адаптивна сітка робіт (`src/components/ui/ShotsGrid.tsx`)
Перевірте, щоб сітка автоматично переходила від одного стовпчика до чотирьох:
```typescript
export const ShotsGrid = ({ shots }: ShotsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {shots.map((shot) => (
        <ShotCard key={shot.id} shot={shot} />
      ))}
    </div>
  )
}
```

### 1.2. Мобільне меню навігації (`src/components/layout/Navbar.tsx`)
Для екранів менше `md` (768px) посилання навігації мають ховатися у меню-бургер або мобільну шторку.
```typescript
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  // ...

  return (
    <header className="sticky top-0 z-50 border-b border-[#27273F] bg-[#0F0F1A]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        {/* ... */}

        {/* Desktop Nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/feed" className="text-sm font-medium text-gray-300 hover:text-white">Inspiration</Link>
          <Link to="/feed?type=work" className="text-sm font-medium text-gray-300 hover:text-white">Find Work</Link>
        </nav>

        {/* Burger Button (visible only on mobile) */}
        <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-[#0F0F1A] border-b border-[#27273F] px-4 py-4 space-y-3 flex flex-col">
          <Link to="/feed" onClick={() => setIsOpen(false)} className="text-sm text-gray-300">Inspiration</Link>
          <Link to="/feed?type=work" onClick={() => setIsOpen(false)} className="text-sm text-gray-300">Find Work</Link>
          {/* ... CTA buttons ... */}
        </div>
      )}
    </header>
  )
}
```

---

## 2. Анімації та мікро-взаємодії (CSS Transitions)

Для wow-ефекту та преміального відчуття інтерфейсу використовуються мікро-анімації на ховери та кліки.

### 2.1. Ефект збільшення та плавної появи overlay в `ShotCard`
Перевірте, чи є плавні переходи:
```html
<!-- Зображення картки -->
<img 
  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
/>

<!-- Екран наведення (Overlay) -->
<div 
  class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
>
  ...
</div>
```

### 2.2. Анімація кліку по кнопці Like (ефект пружності / Pop Effect)
Додайте невеликий ефект при натисканні на кнопки взаємодії:
```css
/* src/index.css */
@utility btn-pop {
  &:active {
    transform: scale(0.92);
  }
  transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```
Використовуйте цей клас для кнопок лайку, збереження та підписки.

---

## 3. Скелетони та обробка помилок (UX/Robustness)

Замість білих екранів під час завантаження використовуються скелетони, а помилки перехоплюються за допомогою React Error Boundary.

### 3.1. Екрани завантаження робіт та коментарів
* **`ShotsSkeleton.tsx`** — рендерить порожні картки з пульсуючим сірим кольором (реалізовано у Фазі 2).
* **`CommentsSkeleton`** — реалізовано у Фазі 3.

### 3.2. Компонент ErrorBoundary (`src/components/ui/ErrorBoundary.tsx`)
Перехоплює критичні помилки рендерингу компонентів та запобігає падінню всього додатка.

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Ой, щось пішло не так</h2>
          <p className="text-gray-400 text-sm mb-4">Сталася непередбачена помилка інтерфейсу.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full text-sm font-semibold"
          >
            Оновити сторінку
          </button>
        </div>
      )
    }
    return this.children
  }
}
```
Обернути `RouterProvider` у [src/main.tsx](file:///home/skmelyuk/Documents/projects/Dribbble/dribble-frontend/src/main.tsx) в `<ErrorBoundary>`:
```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
```

---

## 4. Підготовка до продакшну та вимкнення моків

### 4.1. Конфігурація `.env.production`
Створіть файл `.env.production` у корені проєкту фронтенду:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_USE_MOCKS=false
```

### 4.2. Автоматична перевірка моків у білді
Переконайтеся, що MSW **ніколи** не потрапляє в фінальну збірку (production bundle). Це гарантується логікою в `main.tsx`:
`if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true')` — оскільки `DEV` у продакшні буде `false`, код MSW не ініціалізується.

### 4.3. Команди збірки
```bash
# 1. Запустити лінтер та перевірку типів
npm run lint
npm run build

# 2. Локально перевірити зібраний білд
npm run preview
```

---

## 5. Чеклист тестування та фіналізації Фази 4 (Фронтенд)

- [ ] Перевірено адаптивність у Chrome DevTools на екранах iPhone SE (320px), iPad та Desktop (1440px)
- [ ] Мобільне меню (Navbar drawer) коректно відкривається, закривається та містить всі навігаційні кнопки
- [ ] Усі інтерактивні елементи (картки, кнопки дій) мають плавні hover-стани та пружну реакцію на клік (`btn-pop`)
- [ ] Обернуто додаток у `<ErrorBoundary>`
- [ ] Проєкт успішно збирається командою `npm run build` без помилок TypeScript чи ESLint
- [ ] Перевірено збірку з `VITE_USE_MOCKS=false` — додаток робить реальні запити на порт бекенду та не завантажує MSW
