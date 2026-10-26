import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  ADD_TRANSACTION,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  SUMMARY,
  TRANSACTIONS,
} from '../data/mockData.js';
import { addExpensesToCategories, sumExpenses } from '../utils/analytics.js';

/*
 * Общее состояние финансов для всего приложения.
 * Новые операции из диалога «Добавить операцию» попадают сюда,
 * а «Главная» пересчитывает баланс, доходы, расходы и категории.
 * Это прототип: данные живут до перезагрузки страницы.
 */

const FinanceContext = createContext(null);

// «Сегодня, 14:05»
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const todayLabel = () => `${ADD_TRANSACTION.todayPrefix}, ${timeFormatter.format(new Date())}`;

const findCategory = (type, categoryId) =>
  (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find((c) => c.id === categoryId);

export function FinanceProvider({ children }) {
  // Только добавленные пользователем операции; исходные лежат в mockData
  const [added, setAdded] = useState([]);
  const nextId = useRef(1);

  // type — 'income' | 'expense', amount — положительное число
  const addTransaction = useCallback(({ type, amount, categoryId, comment }) => {
    const category = findCategory(type, categoryId);
    const isIncome = type === 'income';
    setAdded((prev) => [
      {
        id: `added-${nextId.current++}`,
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

  const value = useMemo(() => {
    const incomeAdded = added.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    // Добавленные расходы в виде { categoryId, amount } с положительной суммой
    const addedExpenses = added
      .filter((t) => t.type === 'expense')
      .map((t) => ({ categoryId: t.categoryId, amount: -t.amount }));
    const expenseAdded = sumExpenses(addedExpenses);

    const summary = {
      balance: { ...SUMMARY.balance, amount: SUMMARY.balance.amount + incomeAdded - expenseAdded },
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
    };
  }, [added, addTransaction]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// Хук для доступа к общим финансовым данным
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance нужно вызывать внутри FinanceProvider');
  return context;
};
