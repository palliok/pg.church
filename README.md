# Поклонная гора — фронтенд (React + Vite)

Адаптивная (mobile-first, с десктопной bento-сеткой) вёрстка сайта церкви по макету:
Главная, Расписание, Сборник песен, Новости и блог, О церкви, Поддержать,
детальные страницы события, гимна и проповеди.

## Запуск

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # сборка в dist/
```

## Структура

```
src/
  components/   Header, TabBar, LiveBanner, AppLayout, ArrowKnob
  pages/        Home, Schedule, EventDetail, SermonDetail,
                Songs, SongDetail, Media, About, Donate
  data/         mockData.js — временные данные (заменяются на API)
  styles/       global.css (дизайн-токены), pages.css (сетки/грид)
```

Роутинг — react-router-dom (`App.jsx`). Десктоп: верхнее меню + bento-грид
на главной. Мобильная версия: нижний tab-bar (как в макете «Приложение»),
карточки в один столбец. Переключение вёрстки — через CSS media-queries
(классы `.desktop-only` / `.mobile-only` и модульные сетки в `pages.css`),
без дублирования разметки на JS.

## Подключение к Laravel API

Сейчас все данные лежат в `src/data/mockData.js`. Чтобы переключиться на
бэкенд:

1. Создать `src/api/client.js` с базовым `fetch`-обёртчиком (baseURL,
   заголовки, обработка ошибок/401).
2. Завести `src/api/*.js` по доменам: `events.js`, `songs.js`, `news.js`,
   `donations.js` — каждый экспортирует функции вида `getEvents()`,
   `getEvent(id)`, `getSongs(params)` и т.д., по форме повторяющие объекты
   из `mockData.js` (поля специально подобраны так, чтобы совпадать с
   вероятной структурой REST-ответов).
3. В страницах заменить импорт из `mockData.js` на вызов соответствующей
   функции API внутри `useEffect`/`react-query` (рекомендуется добавить
   `@tanstack/react-query` для кэширования и состояний загрузки).
4. Форму на `/donate` подключить к эндпоинту создания платежа
   (`POST /api/donations`), который возвращает ссылку на оплату
   (ЮKassa/CloudPayments/Тинькофф).
