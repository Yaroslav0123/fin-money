/*
 * Статистика посещений (Яндекс Метрика) и отчёты об ошибках (Sentry).
 * Включаются только в собранном сайте и только если заданы переменные окружения
 * (на Netlify: Site configuration → Environment variables):
 *   VITE_YM_ID      — номер счётчика Метрики;
 *   VITE_SENTRY_DSN — адрес проекта Sentry (DSN).
 * Без них сайт работает как раньше и никуда ничего не отправляет.
 * Финансовые данные пользователя (операции, суммы, цели) не передаются ни туда, ни туда.
 */

const YM_ID = Number(import.meta.env.VITE_YM_ID) || null;
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || null;
const IS_PROD = import.meta.env.PROD;

// Включено ли хоть что-то — от этого зависит текст в окне «О проекте»
export const isMonitoringEnabled = IS_PROD && Boolean(YM_ID || SENTRY_DSN);

// Стандартный код подключения Метрики: очередь вызовов ym(), пока скрипт не загрузился
const loadMetrika = (id) => {
  window.ym =
    window.ym ||
    function (...args) {
      (window.ym.a = window.ym.a || []).push(args);
    };
  window.ym.l = Date.now();
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(script);
  // Вебвизор (запись действий на странице) выключен: на экранах видны суммы.
  // defer — просмотры отправляем сами при смене экрана (у сайта один адрес на все экраны).
  window.ym(id, 'init', { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
};

// Sentry скачивается отдельным файлом и только если он включён
const loadSentry = async (dsn) => {
  const { startSentry } = await import('./sentry.js');
  startSentry(dsn);
};

export function initMonitoring() {
  if (!IS_PROD) return;
  if (YM_ID) loadMetrika(YM_ID);
  if (SENTRY_DSN) loadSentry(SENTRY_DSN).catch(() => {});
}

// Просмотр «страницы» в Метрике: экран приложения как часть адреса после #
export function trackScreen(screen) {
  if (!IS_PROD || !YM_ID || !window.ym) return;
  window.ym(YM_ID, 'hit', `${window.location.origin}/#${screen}`, { title: screen });
}
