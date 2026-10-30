/*
 * Сохранение данных прототипа в localStorage этого браузера.
 * В состоянии только простые значения (иконки хранятся как id), поэтому оно пишется в JSON как есть.
 * Хранилище может быть недоступно (приватный режим, запрет cookies) — тогда
 * приложение просто работает без сохранения.
 */
import { migrateState } from './migrations.js';

// Формат данных записан в них самих (поле version), старые версии обновляет migrations.js
export const STORAGE_KEY = 'fin-money:data';
// Где хранила данные версия 2 (суммы в рублях). Читаем, если нового ключа ещё нет, и не удаляем:
// это копия на случай, если что-то пойдёт не так. v1 — до перехода на историю операций с датами — не читается.
export const LEGACY_STORAGE_KEY = 'fin-money:demo:v2';

export const saveFinanceState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Сохранение недоступно — работаем без него
  }
};

const readJson = (key) => {
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

const isValid = (data) =>
  Array.isArray(data.transactions) &&
  Array.isArray(data.savingsTransactions) &&
  Array.isArray(data.goals) &&
  Array.isArray(data.categories) &&
  Array.isArray(data.accounts) &&
  data.accounts.length > 0 &&
  data.accounts.every((account) => Number.isFinite(account.openingBalance));

// Сохранённое состояние в текущем формате или null, если его нет либо оно повреждено
export const loadFinanceState = () => {
  try {
    const saved = readJson(STORAGE_KEY) ?? readJson(LEGACY_STORAGE_KEY);
    if (!saved || typeof saved !== 'object') return null;
    const data = migrateState(saved);
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
};

export const clearFinanceState = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Нечего очищать
  }
};
