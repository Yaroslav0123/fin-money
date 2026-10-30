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
| `npm run test:e2e` | сквозные тесты Playwright в браузере (сайт собирается и запускается сам) |

Перед первым запуском сквозных тестов скачайте браузер: `npx playwright install chromium`.
Если скачанный Chromium не запускается (бывает на Windows), используйте установленный Chrome или Edge:
`PW_CHANNEL=chrome npm run test:e2e` (в PowerShell — `$env:PW_CHANNEL='chrome'; npm run test:e2e`).

## Импорт выписки

Экран «Операции» → «Импорт выписки». Файл читается в браузере и никуда не отправляется.

- **PDF-выписка по карте Сбербанка** (из СберБанк Онлайн). Текст достаёт pdf.js — он подгружается отдельным файлом только при выборе PDF. Формат взят из общедоступных описаний; проверен на образце `samples/sber-vypiska-primer.pdf` с вымышленными данными (пересоздать: `npm run sample:sber`). Сканы и фото не подходят.
- Подходят CSV в UTF-8 и Windows-1251 с разделителем `;`, `,` или табуляцией. Нужны столбцы с датой и суммой: одна сумма со знаком или отдельные «Приход» и «Расход».
- Неудачные операции (по столбцу «Статус») пропускаются. Переводы между своими счетами не входят в доходы и расходы, возвраты покупок уменьшают расходы.
- Перед загрузкой видны все строки: можно сменить категорию или снять галочку. Повторно загруженные операции не дублируются.
- Импорт можно отменить целиком: «Настройки» → «История импорта».

Логика разбора — `src/utils/csv.js`, `src/utils/pdf.js` и `src/utils/bankPdf.js` (PDF → строки таблицы), `src/utils/statement.js` (общий разбор); слова для распознавания — `CSV_TEXTS` в `src/data/mockData.js`.

## Автопроверка (GitHub Actions)

После каждого push в `main` и в каждом pull request GitHub запускает `.github/workflows/ci.yml`:
линтер, модульные тесты, сборка и сквозные тесты. Результат — на вкладке Actions репозитория.
Если сквозные тесты упали, на странице проверки можно скачать отчёт `playwright-report` со снимками экрана.

## Статистика и ошибки (необязательно)

Яндекс Метрика и Sentry включаются переменными окружения на Netlify
(Site configuration → Environment variables), после чего нужно пересобрать сайт (Deploys → Trigger deploy):

| Переменная | Что это | Где взять |
|---|---|---|
| `VITE_YM_ID` | номер счётчика Метрики | metrika.yandex.ru → Добавить счётчик |
| `VITE_SENTRY_DSN` | адрес проекта Sentry | sentry.io → проект Browser JavaScript → Settings → Client Keys (DSN) |

Без переменных сайт ничего никуда не отправляет. Вебвизор Метрики выключен, финансовые данные не передаются.
Код — в `src/utils/monitoring.js`.

## Публикация (Netlify)

Сайт: https://fin-money-app.netlify.app · репозиторий: https://github.com/Yaroslav0123/fin-money

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

Передача работы и известные ограничения — в `HANDOFF.md`. `AUDIT_REPORT.md` — исторический отчёт аудита от 26.10.2026.
