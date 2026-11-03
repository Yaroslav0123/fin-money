import { SETTINGS_PAGE } from '../data/mockData.js';
import { toDateInputValue } from './dates.js';

// Скачивание файла, собранного в браузере (без сервера)
export const downloadFile = (content, fileName, type = 'text/csv;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Даём браузеру начать загрузку, потом освобождаем память
  setTimeout(() => URL.revokeObjectURL(url));
};

// Резервная копия всех данных: fin-money-backup-2026-11-03.json
export const downloadBackup = (content, date = new Date()) =>
  downloadFile(content, `${SETTINGS_PAGE.backup.fileName}-${toDateInputValue(date)}.json`, 'application/json;charset=utf-8');
