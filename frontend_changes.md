# Документація змін: Фронтенд (React / Vite)

У процесі налаштування клієнтської частини та її інтеграції з реальним сервером Django у Docker були внесені зміни до конфігураційних файлів, API-модулів та компонентів сторінок. Нижче наведено детальний опис та обґрунтування цих змін.

---

## 1. Конфігурація підключення до реального сервера

### 🆕 [.env.local](file:///home/skmelyuk/Documents/projects/Dribbble/dribble-frontend/.env.local)
* **Що зроблено**: Створено локальний файл конфігурації оточення.
* **Чому це необхідно**: Дозволяє налаштувати фронтенд на роботу з реальним локальним сервером розробки Django замість використання імітованих даних Mock Service Worker (MSW).
* **Вміст файлу**:
  ```env
  VITE_API_BASE_URL=http://localhost:8000/api
  VITE_USE_MOCKS=false
  ```
  Це вимикає перехоплення запитів бібліотекою MSW та скеровує їх на порт `8000`.

---

## 2. Усунення помилки завантаження файлів (Multipart boundary bug)

При спробі завантажити зображення (фото профілю на етапі реєстрації або зображення роботи при публікації Shot) сервер повертав помилку `400 Bad Request` з описом:
`"The submitted data was not a file. Check the encoding type on the form."`

### 📝 [src/api/index.ts](file:///home/skmelyuk/Documents/projects/Dribbble/dribble-frontend/src/api/index.ts)
* **Що зроблено**: 
  1. Додано автоматичне очищення заголовка `Content-Type` у глобальному Axios-перехоплювачі (Request Interceptor) для випадків, коли тілом запиту є об'єкт `FormData` (завантаження файлів):
     ```typescript
     if (config.data instanceof FormData && config.headers) {
       config.headers.delete('Content-Type');
     }
     ```
  2. Оновлено хелпер `updateProfile`, прибравши ручне виставлення заголовка `Content-Type: multipart/form-data`.
* **Чому це необхідно**: Axios за замовчуванням мав глобальне налаштування `'Content-Type': 'application/json'`. Якщо ми робимо запит із `FormData` (як у профілі чи публікації робіт), Axios зливав ці налаштування, і заголовок надсилався як `multipart/form-data` **без унікального ідентифікатора межі файлів (boundary)**. Видалення цього заголовка з налаштувань Axios змушує браузер згенерувати заголовок самостійно разом із `boundary=----WebKitFormBoundary...`, завдяки чому Django REST Framework може успішно розпарсити та зберегти файл.

### 📝 [src/api/shots.ts](file:///home/skmelyuk/Documents/projects/Dribbble/dribble-frontend/src/api/shots.ts)
* **Що зроблено**: Прибрано ручне виставлення `'Content-Type': 'multipart/form-data'` з заголовків функції `createShot`.
* **Чому це необхідно**: Аналогічно до профілю, це вирішує проблему відсутності `boundary` при завантаженні зображень робіт (Shots) на сервер, дозволяючи браузеру автоматично сформувати правильний HTTP-заголовок.

---

## 3. Сумісність зі структурою коментарів бекенду (Crash fix)

При переході на детальну сторінку щойно опублікованої роботи (`/shot/:id`) додаток аварійно завершував роботу (білий екран) із помилкою:
`TypeError: Cannot read properties of undefined (reading 'length')` у файлі `ShotDetailPage.tsx`.

### 📝 [src/pages/ShotDetailPage.tsx](file:///home/skmelyuk/Documents/projects/Dribbble/dribble-frontend/src/pages/ShotDetailPage.tsx)
* **Що зроблено**: Оновлено логіку отримання та рендерингу списку коментарів. Створено проміжну змінну `comments`, яка робить перевірку типу отриманих даних:
  ```typescript
  const comments = Array.isArray(commentsData) ? commentsData : (commentsData?.results || [])
  ```
  І скрізь у коді рендерингу (підрахунок кількості та відображення списку) звернення переведено на цю нову змінну замість прямого доступу до `commentsData?.results`.
* **Чому це необхідно**: Спочатку фронтенд розроблявся з очікуванням пагінованої відповіді коментарів (де список лежить всередині поля `results` — таку структуру повертали мок-сервіси). Проте реальний бекенд Django повертає коментарі у вигляді простого плоского масиву `[...]`. Написаний нами код робить клієнтську частину універсальною та сумісною з обома форматами відповідей, що усунуло падіння сторінки.
