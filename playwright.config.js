import { defineConfig, devices } from '@playwright/test';

/*
 * Сквозные (e2e) тесты: настоящий браузер открывает собранный сайт и проходит сценарии пользователя.
 * Запуск: npm run test:e2e. Сайт собирается и запускается сам (vite preview на порту 4173);
 * если preview уже запущен, тесты используют его — тогда перед запуском сделайте npm run build.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  // На GitHub тесты не должны молча пропускаться из-за забытого test.only
  forbidOnly: Boolean(process.env.CI),
  // На сервере сборки даём один повтор: иногда браузер там подтормаживает
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    // Снимок и запись шагов — только для упавших тестов, чтобы было видно, что пошло не так
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Браузер: по умолчанию Chromium из Playwright. Если он не запускается (бывает на Windows),
    // можно взять установленный: PW_CHANNEL=chrome или PW_CHANNEL=msedge
    channel: process.env.PW_CHANNEL || undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }, testIgnore: /mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 5'] }, testMatch: /mobile/ },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
