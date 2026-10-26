# Fin Money

Прототип веб-приложения для учёта личных финансов: лендинг и экраны «Главная», «Накопления», «Аналитика», «Цели», «Настройки».
Только фронтенд: все данные моковые (`src/data/mockData.js`) и живут до перезагрузки страницы.

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

## Структура

- `src/screens/` — экраны приложения и лендинг;
- `src/components/` — компоненты по разделам (`app`, `dashboard`, `savings`, `goals`, `analytics`, `settings`, `landing`, `ui`);
- `src/context/` — общее состояние финансов (`FinanceContext`) и действия интерфейса (`AppActionsContext`);
- `src/data/mockData.js` — все тексты и данные;
- `src/theme/` — палитра и цвета акцентов.

Отчёт аудита готовности к релизу — в `AUDIT_REPORT.md`.
