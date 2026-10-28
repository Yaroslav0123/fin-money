# Fin Money

Прототип веб-приложения для учёта личных финансов: лендинг и экраны «Главная», «Накопления», «Аналитика», «Цели», «Настройки».
Только фронтенд: исходные данные моковые (`src/data/mockData.js`), изменения пользователя сохраняются в `localStorage` его браузера.

Стек: React 18, Vite 6, Tailwind CSS 3, Recharts, Framer Motion, lucide-react.

## Запуск

Нужен Node.js 20 (проверено на 20.10).

```bash
npm install
npm run dev
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер с горячей перезагрузкой |
| `npm run build` | сборка в папку `dist/` |
| `npm run preview` | просмотр собранной версии |
| `npm run lint` | проверка кода ESLint |
| `npm test` | тесты Vitest (однократно) |
| `npm run test:watch` | тесты в режиме наблюдения |

## Публикация (Netlify)

Сайт статический: `npm run build` собирает его в `dist/`, сервер не нужен.
Netlify подключён к GitHub-репозиторию и после каждого `git push` в `main` сам собирает и обновляет сайт.
Настройки сборки (команда, папка, версия Node) и кэширования — в `netlify.toml`, в интерфейсе Netlify менять ничего не нужно.

Первое подключение:

1. Netlify → Add new site → Import an existing project → GitHub → репозиторий проекта.
2. Настройки подтянутся из `netlify.toml` — нажать Deploy.
3. Site configuration → Change site name — задать понятный адрес, например `fin-money.netlify.app`.

Картинка для превью ссылки в мессенджерах — `public/og-image.png` (1200×630).

## Структура

- `src/screens/` — экраны приложения и лендинг;
- `src/components/` — компоненты по разделам (`app`, `dashboard`, `savings`, `goals`, `analytics`, `settings`, `landing`, `ui`);
- `src/context/` — общее состояние финансов (`FinanceContext`) и действия интерфейса (`AppActionsContext`);
- `src/data/mockData.js` — все тексты и данные;
- `src/theme/` — палитра и цвета акцентов.

Отчёт аудита готовности к релизу — в `AUDIT_REPORT.md`.
