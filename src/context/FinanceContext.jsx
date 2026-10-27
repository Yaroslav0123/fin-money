import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ADD_TRANSACTION,
  EXPENSE_CATEGORIES,
  GOAL_TRANSFER,
  GOALS,
  INCOME_CATEGORIES,
  SAVINGS,
  SAVINGS_PAGE,
  SAVINGS_TRANSACTIONS,
  SAVINGS_TRANSFER,
  SETTINGS_PAGE,
  SUMMARY,
  TRANSACTIONS,
} from '../data/mockData.js';
import { addExpensesToCategories, sumExpenses } from '../utils/analytics.js';
import { clearFinanceState, loadFinanceState, saveFinanceState } from './financeStorage.js';

/*
 * Общее состояние финансов для всего приложения:
 * - операции из диалога «Добавить операцию» → баланс, доходы, расходы, категории;
 * - накопительный счёт: баланс и история пополнений / снятий;
 * - финансовые цели: пополнение (перевод с основного счёта) и создание;
 * - настройка «Скрывать баланс».
 * Это прототип без сервера: данные сохраняются в localStorage этого браузера,
 * resetDemo() возвращает исходные данные из mockData.
 */

const FinanceContext = createContext(null);

// «Сегодня, 14:05»
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const todayLabel = () => `${ADD_TRANSACTION.todayPrefix}, ${timeFormatter.format(new Date())}`;

const findCategory = (type, categoryId) =>
  (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find((c) => c.id === categoryId);

// Начальное значение «Скрывать баланс» берём из переключателей «Безопасности»
const HIDE_BALANCE_DEFAULT = SETTINGS_PAGE.security.toggles.find((t) => t.id === 'hideBalance').defaultOn;

const sumAmounts = (items) => items.reduce((sum, t) => sum + t.amount, 0);

// Счётчик id новых записей начинается с единицы
const FIRST_ID = 1;

export function FinanceProvider({ children }) {
  // Сохранённое в браузере состояние читаем один раз при запуске
  const [saved] = useState(loadFinanceState);
  // Только добавленные пользователем операции по основному счёту; исходные лежат в mockData
  const [added, setAdded] = useState(saved?.added ?? []);
  const [savingsBalance, setSavingsBalance] = useState(saved?.savingsBalance ?? SAVINGS.balance);
  const [savingsTransactions, setSavingsTransactions] = useState(saved?.savingsTransactions ?? SAVINGS_TRANSACTIONS);
  const [goals, setGoals] = useState(saved?.goals ?? GOALS);
  const [hideBalance, setHideBalance] = useState(saved?.hideBalance ?? HIDE_BALANCE_DEFAULT);
  const nextId = useRef(saved?.nextId ?? FIRST_ID);
  const newId = (prefix) => `${prefix}-${nextId.current++}`;

  // Любое изменение сразу сохраняем в браузере
  useEffect(() => {
    saveFinanceState({ added, savingsBalance, savingsTransactions, goals, hideBalance, nextId: nextId.current });
  }, [added, savingsBalance, savingsTransactions, goals, hideBalance]);

  // Сброс демо-данных к исходным из mockData
  const resetDemo = useCallback(() => {
    clearFinanceState();
    nextId.current = FIRST_ID;
    setAdded([]);
    setSavingsBalance(SAVINGS.balance);
    setSavingsTransactions(SAVINGS_TRANSACTIONS);
    setGoals(GOALS);
    setHideBalance(HIDE_BALANCE_DEFAULT);
  }, []);

  // type — 'income' | 'expense', amount — положительное число
  const addTransaction = useCallback(({ type, amount, categoryId, comment }) => {
    const category = findCategory(type, categoryId);
    const isIncome = type === 'income';
    setAdded((prev) => [
      {
        id: newId('added'),
        type,
        categoryId,
        title: comment || category.name,
        category: isIncome ? ADD_TRANSACTION.incomeCategoryLabel : category.name,
        date: todayLabel(),
        amount: isIncome ? amount : -amount,
        icon: category.icon,
        accent: category.accent,
      },
      ...prev,
    ]);
  }, []);

  /*
   * Пополнение или снятие с накопительного счёта.
   * Деньги переходят между счетами: накопления растут — общий баланс уменьшается, и наоборот.
   * mode — 'deposit' | 'withdraw', amount — положительное число.
   */
  const moveSavings = useCallback((mode, amount) => {
    const toSavings = mode === 'withdraw' ? -amount : amount;
    setSavingsBalance((prev) => prev + toSavings);
    setSavingsTransactions((prev) => [
      { id: newId('saving'), type: mode, date: SAVINGS_PAGE.dialog.newTxDate, amount: toSavings },
      ...prev,
    ]);
    setAdded((prev) => [
      {
        id: newId('transfer'),
        type: 'transfer',
        kind: 'savings',
        title: SAVINGS_TRANSFER.titles[mode],
        category: SAVINGS_TRANSFER.category,
        date: todayLabel(),
        amount: -toSavings,
        icon: SAVINGS_TRANSFER.icon,
        accent: SAVINGS_TRANSFER.accent,
      },
      ...prev,
    ]);
  }, []);

  // Пополнение цели — перевод с основного счёта: цель растёт, общий баланс уменьшается
  const depositToGoal = useCallback((goal, amount) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, saved: g.saved + amount } : g)));
    setAdded((prev) => [
      {
        id: newId('goal-transfer'),
        type: 'transfer',
        kind: 'goal',
        title: `${GOAL_TRANSFER.titlePrefix} «${goal.name}»`,
        category: GOAL_TRANSFER.category,
        date: todayLabel(),
        amount: -amount,
        icon: GOAL_TRANSFER.icon,
        accent: GOAL_TRANSFER.accent,
      },
      ...prev,
    ]);
  }, []);

  // draft — { name, target, icon, accent, deadline, ... } из диалога создания
  const createGoal = useCallback((draft) => {
    setGoals((prev) => [...prev, { ...draft, id: newId('new-goal'), saved: 0 }]);
  }, []);

  const value = useMemo(() => {
    const incomeAdded = sumAmounts(added.filter((t) => t.type === 'income'));
    // Переводы на накопления, в цели и обратно: не доход и не расход
    const transfersAdded = sumAmounts(added.filter((t) => t.type === 'transfer'));
    // Добавленные расходы в виде { categoryId, amount } с положительной суммой
    const addedExpenses = added
      .filter((t) => t.type === 'expense')
      .map((t) => ({ categoryId: t.categoryId, amount: -t.amount }));
    const expenseAdded = sumExpenses(addedExpenses);

    const summary = {
      balance: {
        ...SUMMARY.balance,
        amount: SUMMARY.balance.amount + incomeAdded - expenseAdded + transfersAdded,
      },
      income: { ...SUMMARY.income, amount: SUMMARY.income.amount + incomeAdded },
      expenses: { ...SUMMARY.expenses, amount: SUMMARY.expenses.amount + expenseAdded },
    };

    // Суммы категорий растут на добавленные расходы, доли пересчитываются
    const categories = addExpensesToCategories(EXPENSE_CATEGORIES, addedExpenses, summary.expenses.amount);

    return {
      transactions: [...added, ...TRANSACTIONS],
      addedExpenses,
      summary,
      categories,
      addTransaction,
      savingsBalance,
      savingsTransactions,
      moveSavings,
      goals,
      depositToGoal,
      createGoal,
      hideBalance,
      setHideBalance,
      resetDemo,
    };
  }, [
    added,
    addTransaction,
    savingsBalance,
    savingsTransactions,
    moveSavings,
    goals,
    depositToGoal,
    createGoal,
    hideBalance,
    resetDemo,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// Хук для доступа к общим финансовым данным
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance нужно вызывать внутри FinanceProvider');
  return context;
};
