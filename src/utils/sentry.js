import { init } from '@sentry/browser';

/*
 * Подключение Sentry. Отдельный файл, который utils/monitoring.js загружает только при заданном DSN:
 * так в сборку попадает лишь нужная часть библиотеки, а без DSN она вообще не скачивается.
 */
export function startSentry(dsn) {
  init({
    dsn,
    environment: import.meta.env.MODE,
    // Без IP-адреса и других персональных данных, без замеров скорости
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}
