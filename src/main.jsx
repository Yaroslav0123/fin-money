import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { isEnglish, LANGUAGE } from './data/language.js';
import { PAGE_TITLE } from './data/mockData.js';
import './index.css';
import { initMonitoring } from './utils/monitoring.js';

// Метрика и Sentry — только если включены в настройках сайта (см. utils/monitoring.js)
initMonitoring();

// Язык страницы для браузера и экранных дикторов; заголовок вкладки в index.html — русский
document.documentElement.lang = LANGUAGE;
if (isEnglish) document.title = PAGE_TITLE;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Сообщаем экрану загрузки из index.html, что приложение запустилось
window.__finMoneyBootDone?.();
