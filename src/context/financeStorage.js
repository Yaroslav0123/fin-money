/*
 * Сохранение данных прототипа в localStorage этого браузера.
 * В состоянии только простые значения (иконки хранятся как id), поэтому оно пишется в JSON как есть.
 * Хранилище может быть недоступно (приватный режим, запрет cookies) — тогда
 * приложение просто работает без сохранения.
 */

// Версия в ключе: при несовместимой смене формата старые данные игнорируются.
// v1 — до перехода на историю операций с датами.
export const STORAGE_KEY = 'fin-money:demo:v2';

export const saveFinanceState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Сохранение недоступно — работаем без него
  }
};

// Сохранённое состояние или null, если его нет либо оно повреждено
export const loadFinanceState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const isValid =
      Array.isArray(data.transactions) &&
      Array.isArray(data.savingsTransactions) &&
      Array.isArray(data.goals) &&
      Array.isArray(data.categories) &&
      typeof data.openingBalance === 'number';
    return isValid ? data : null;
  } catch {
    return null;
  }
};

export const clearFinanceState = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Нечего очищать
  }
};
