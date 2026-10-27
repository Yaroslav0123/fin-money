import {
  EXPENSE_CATEGORIES,
  GOAL_ICON_OPTIONS,
  GOAL_TRANSFER,
  GOALS,
  INCOME_CATEGORIES,
  SAVINGS_TRANSFER,
} from '../data/mockData.js';

/*
 * Сохранение демо-данных в localStorage этого браузера.
 * Иконки — React-компоненты, их нельзя записать в JSON: при сохранении убираем,
 * при загрузке восстанавливаем по категории, виду перевода или id цели.
 * Хранилище может быть недоступно (приватный режим, запрет cookies) — тогда
 * приложение просто работает без сохранения.
 */

// Версия в ключе: при несовместимой смене формата старые данные игнорируются
const STORAGE_KEY = 'fin-money:demo:v1';

const withoutIcon = (item) => {
  const copy = { ...item };
  delete copy.icon;
  return copy;
};

// Иконка операции основного счёта
const transactionIcon = (tx) => {
  if (tx.type === 'transfer') return (tx.kind === 'goal' ? GOAL_TRANSFER : SAVINGS_TRANSFER).icon;
  const categories = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find((c) => c.id === tx.categoryId)?.icon;
};

// Иконка цели: у исходных целей — из mockData, у созданных — из вариантов выбора
const goalIcon = (goal) =>
  GOALS.find((g) => g.id === goal.id)?.icon ?? GOAL_ICON_OPTIONS.find((o) => o.id === goal.iconId)?.icon;

// state — { added, savingsBalance, savingsTransactions, goals, hideBalance, nextId }
export const saveFinanceState = (state) => {
  try {
    const data = { ...state, added: state.added.map(withoutIcon), goals: state.goals.map(withoutIcon) };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    return {
      ...data,
      added: data.added.map((tx) => ({ ...tx, icon: transactionIcon(tx) })),
      goals: data.goals.map((goal) => ({ ...goal, icon: goalIcon(goal) })),
    };
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
