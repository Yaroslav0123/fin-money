import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initMonitoring } from './utils/monitoring.js';

// Метрика и Sentry — только если включены в настройках сайта (см. utils/monitoring.js)
initMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Сообщаем экрану загрузки из index.html, что приложение запустилось
window.__finMoneyBootDone?.();
