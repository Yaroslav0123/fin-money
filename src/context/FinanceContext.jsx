import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createDemoData, createEmptyData } from '../data/demoData.js';
import {
  CATEGORY_ICONS,
  GOAL_TRANSFER,
  GOALS_PAGE,
  IMPORT_FALLBACK_INCOME,
  IMPORT_TRANSFER,
  SAVINGS_PAGE,
  SAVINGS_TRANSFER,
  SAVINGS_TX_TYPES,
  SETTINGS_PAGE,
  SUMMARY,
} from '../data/mockData.js';
import { formatDay, formatFullDate, formatTransactionDate } from '../utils/dates.js';
import { categoryBreakdown, goalMonthsLeft, isGoalDone, monthSummary, savingsStats } from '../utils/finance.js';
import { setDisplayCurrency } from '../utils/format.js';
import { signedDraftAmount } from '../utils/statement.js';
import { clearFinanceState, loadFinanceState, saveFinanceState } from './financeStorage.js';

/*
 * Общее состояние финансов для всего приложения.
 * Хранится история операций с датами, а всё, что видно на экранах (баланс, доходы и расходы
 * за месяц, категории, графики), считается из неё — см. utils/finance.js.
 * Это прототип без сервера: данные сохраняются в localStorage этого браузера,
 * resetDemo() заново строит демо-историю от сегодняшнего дня, startFromScratch() — очищает всё.
 */

const FinanceContext = createContext(null);

// Счётчик id новых записей начинается с единицы
const FIRST_ID = 1;

// Настройки по умолчанию: из карточек «Параметры», «Бюджет» и «Безопасность»
const { preferences, budget, security } = SETTINGS_PAGE;
const DEFAULT_SETTINGS = {
  theme: preferences.theme.default,
  currency: preferences.currency.default,
  weekStart: preferences.weekStart.default,
  language: preferences.language.default,
  budgetLimit: budget.defaultLimit,
  hideBalance: security.toggles.find((t) => t.id === 'hideBalance').defaultOn,
};

// Новое состояние: данные (демо или пустые) + настройки.
// imports — история загруженных выписок: { id, fileName, date (ISO), count }.
const buildState = (data, settings = DEFAULT_SETTINGS, onboardingDone = false) => ({
  ...data,
  imports: [],
  settings,
  onboardingDone,
  nextId: FIRST_ID,
});

// Сохранённое состояние дополняем настройками, появившимися в новых версиях
const restoreState = () => {
  const saved = loadFinanceState();
  if (!saved) return buildState(createDemoData());
  return { imports: [], ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
};

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

// Нужна ли тёмная тема: явный выбор или (для «Авто») настройка устройства с подпиской на её смену
const DARK_QUERY = '(prefers-color-scheme: dark)';
function useSystemDark(theme) {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY);
    if (!query) return undefined;
    const handleChange = (e) => setSystemDark(e.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);
  return theme === 'dark' || (theme === 'system' && systemDark);
}

// Запасная категория при удалении: «Другое» того же типа или первая оставшаяся
const fallbackCategory = (categories, removed) => {
  const sameType = categories.filter((c) => c.type === removed.type && c.id !== removed.id);
  return sameType.find((c) => c.iconId === 'other') ?? sameType[0];
};

export function FinanceProvider({ children }) {
  const [state, setState] = useState(restoreState);

  // Любое изменение сразу сохраняем в браузере
  useEffect(() => {
    saveFinanceState(state);
  }, [state]);

  // Валюта отображения нужна formatMoney ещё до отрисовки дочерних компонентов
  setDisplayCurrency(state.settings.currency);

  // Тема: класс .dark на <html>. «Авто» следит за настройкой устройства и её изменениями.
  const isDark = useSystemDark(state.settings.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Изменение состояния с выдачей нового id: change(state, newId) → новое состояние
  const update = useCallback((change) => {
    setState((prev) => {
      let next = prev.nextId;
      const newId = (prefix) => `${prefix}-${(next += 1) - 1}`;
      const result = change(prev, newId);
      return { ...result, nextId: next };
    });
  }, []);

  // ───── Операции основного счёта ─────

  // draft — { type: 'income' | 'expense', amount (положительное), categoryId, comment, date? }
  const addTransaction = useCallback(
    (draft) =>
      update((prev, newId) => {
        const tx = {
          id: newId('tx'),
          type: draft.type,
          categoryId: draft.categoryId,
          comment: draft.comment ?? '',
          amount: draft.type === 'income' ? draft.amount : -draft.amount,
          date: (draft.date ?? new Date()).toISOString(),
        };
        return { ...prev, transactions: [tx, ...prev.transactions].sort(byDateDesc) };
      }),
    [update],
  );

  /*
   * Импорт выписки одним пакетом: drafts — из rowsToDrafts (тип, сумма, incoming, категория, дата, importKey).
   * Каждая операция помнит id пакета, поэтому импорт можно отменить целиком.
   * Переводы между своими счетами — type 'transfer', kind 'import': меняют баланс, но не доходы и расходы.
   */
  const addTransactions = useCallback(
    (drafts, { fileName = '' } = {}) =>
      update((prev, newId) => {
        const importId = newId('import');
        const added = drafts.map((draft) => {
          const base = {
            id: newId('tx'),
            importId,
            importKey: draft.importKey,
            comment: draft.comment ?? '',
            amount: signedDraftAmount(draft),
            date: draft.date.toISOString(),
          };
          return draft.type === 'transfer' ? { ...base, type: 'transfer', kind: 'import' } : { ...base, type: draft.type, categoryId: draft.categoryId };
        });
        // «Прочие доходы» появляются, только если пригодились
        const needsFallback =
          added.some((tx) => tx.categoryId === IMPORT_FALLBACK_INCOME.id) && !prev.categories.some((c) => c.id === IMPORT_FALLBACK_INCOME.id);
        return {
          ...prev,
          categories: needsFallback ? [...prev.categories, IMPORT_FALLBACK_INCOME] : prev.categories,
          transactions: [...added, ...prev.transactions].sort(byDateDesc),
          imports: [{ id: importId, fileName, date: new Date().toISOString(), count: added.length }, ...prev.imports],
        };
      }),
    [update],
  );

  // Отмена импорта: удаляются все операции пакета, в том числе изменённые после загрузки
  const undoImport = useCallback(
    (importId) =>
      update((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((tx) => tx.importId !== importId),
        imports: prev.imports.filter((item) => item.id !== importId),
      })),
    [update],
  );

  // Изменение дохода или расхода (переводы не редактируются — их можно только удалить).
  // Возврат покупки (расход с плюсом) остаётся возвратом, пока операция — расход.
  const updateTransaction = useCallback(
    (id, draft) =>
      update((prev) => ({
        ...prev,
        transactions: prev.transactions
          .map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  type: draft.type,
                  categoryId: draft.categoryId,
                  comment: draft.comment ?? '',
                  amount: signedDraftAmount({
                    amount: draft.amount,
                    incoming: draft.type === 'income' || (draft.type === 'expense' && tx.type === 'expense' && tx.amount > 0),
                  }),
                  date: (draft.date ?? new Date(tx.date)).toISOString(),
                }
              : tx,
          )
          .sort(byDateDesc),
      })),
    [update],
  );

  // Удаление операции. У переводов откатываем и вторую сторону: накопления или цель.
  const deleteTransaction = useCallback(
    (id) =>
      update((prev) => {
        const tx = prev.transactions.find((t) => t.id === id);
        if (!tx) return prev;
        const next = { ...prev, transactions: prev.transactions.filter((t) => t.id !== id) };
        if (tx.kind === 'savings' && tx.savingsTxId) {
          next.savingsTransactions = prev.savingsTransactions.filter((t) => t.id !== tx.savingsTxId);
        }
        if (tx.kind === 'goal' && tx.mode !== 'return') {
          next.goals = prev.goals.map((g) => (g.id === tx.goalId ? { ...g, saved: Math.max(0, g.saved + tx.amount) } : g));
        }
        return next;
      }),
    [update],
  );

  // ───── Накопительный счёт и цели ─────

  /*
   * Пополнение или снятие с накопительного счёта.
   * Деньги переходят между счетами: накопления растут — общий баланс уменьшается, и наоборот.
   * mode — 'deposit' | 'withdraw', amount — положительное число.
   */
  const moveSavings = useCallback(
    (mode, amount) =>
      update((prev, newId) => {
        const toSavings = mode === 'withdraw' ? -amount : amount;
        const date = new Date().toISOString();
        const savingsTxId = newId('saving');
        return {
          ...prev,
          savingsTransactions: [{ id: savingsTxId, type: mode, amount: toSavings, date }, ...prev.savingsTransactions],
          transactions: [
            { id: newId('transfer'), type: 'transfer', kind: 'savings', mode, savingsTxId, amount: -toSavings, date },
            ...prev.transactions,
          ],
        };
      }),
    [update],
  );

  // Пополнение цели — перевод с основного счёта: цель растёт, общий баланс уменьшается
  const depositToGoal = useCallback(
    (goal, amount) =>
      update((prev, newId) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goal.id ? { ...g, saved: g.saved + amount } : g)),
        transactions: [
          {
            id: newId('goal-transfer'),
            type: 'transfer',
            kind: 'goal',
            goalId: goal.id,
            goalName: goal.name,
            amount: -amount,
            date: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      })),
    [update],
  );

  // draft — { name, target, deadline (Date), iconId, accent }
  const createGoal = useCallback(
    (draft) =>
      update((prev, newId) => ({
        ...prev,
        goals: [...prev.goals, { ...draft, deadline: draft.deadline.toISOString(), id: newId('goal'), saved: 0 }],
      })),
    [update],
  );

  const updateGoal = useCallback(
    (id, draft) =>
      update((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...draft, deadline: draft.deadline.toISOString() } : g)),
      })),
    [update],
  );

  // Удаление цели: накопленное на ней возвращается на основной счёт
  const deleteGoal = useCallback(
    (id) =>
      update((prev, newId) => {
        const goal = prev.goals.find((g) => g.id === id);
        if (!goal) return prev;
        const refund =
          goal.saved > 0
            ? [
                {
                  id: newId('goal-transfer'),
                  type: 'transfer',
                  kind: 'goal',
                  mode: 'return',
                  goalId: goal.id,
                  goalName: goal.name,
                  amount: goal.saved,
                  date: new Date().toISOString(),
                },
              ]
            : [];
        return { ...prev, goals: prev.goals.filter((g) => g.id !== id), transactions: [...refund, ...prev.transactions] };
      }),
    [update],
  );

  // ───── Категории ─────

  // draft — { type, name, iconId, accent }
  const addCategory = useCallback(
    (draft) => update((prev, newId) => ({ ...prev, categories: [...prev.categories, { ...draft, id: newId('category') }] })),
    [update],
  );

  const updateCategory = useCallback(
    (id, draft) =>
      update((prev) => ({ ...prev, categories: prev.categories.map((c) => (c.id === id ? { ...c, ...draft } : c)) })),
    [update],
  );

  // Удаление категории: её операции переходят в запасную категорию того же типа
  const deleteCategory = useCallback(
    (id) =>
      update((prev) => {
        const removed = prev.categories.find((c) => c.id === id);
        const fallback = removed && fallbackCategory(prev.categories, removed);
        if (!fallback) return prev;
        return {
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
          transactions: prev.transactions.map((tx) => (tx.categoryId === id ? { ...tx, categoryId: fallback.id } : tx)),
        };
      }),
    [update],
  );

  // ───── Настройки и режимы ─────

  const setSetting = useCallback(
    (key, value) => setState((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } })),
    [],
  );
  const setHideBalance = useCallback((value) => setSetting('hideBalance', value), [setSetting]);

  // Новая демо-история от сегодняшнего дня; настройки сохраняются
  const resetDemo = useCallback(() => {
    clearFinanceState();
    setState((prev) => buildState(createDemoData(), prev.settings, true));
  }, []);

  // Пустой аккаунт: без операций, накоплений и целей
  const startFromScratch = useCallback(() => {
    setState((prev) => buildState(createEmptyData(), prev.settings, true));
  }, []);

  const completeOnboarding = useCallback(() => setState((prev) => ({ ...prev, onboardingDone: true })), []);

  // ───── То, что показывают экраны ─────

  const value = useMemo(() => {
    const today = new Date();

    // Категории с иконками; у удалённой категории операции уже переназначены
    const categories = state.categories.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.iconId] ?? CATEGORY_ICONS.other }));
    const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

    // Операция в виде для списков: иконка, цвет, заголовок, подпись категории и даты
    const describe = (tx) => {
      const date = new Date(tx.date);
      const dateLabel = formatTransactionDate(date, today);
      if (tx.type === 'transfer' && tx.kind === 'import') {
        const { category, icon, accent } = IMPORT_TRANSFER;
        return { ...tx, title: tx.comment || IMPORT_TRANSFER.title, category, icon, accent, dateLabel, editable: false };
      }
      if (tx.type === 'transfer') {
        const isGoal = tx.kind === 'goal';
        const title = isGoal
          ? `${tx.mode === 'return' ? GOAL_TRANSFER.returnPrefix : GOAL_TRANSFER.titlePrefix} «${tx.goalName}»`
          : SAVINGS_TRANSFER.titles[tx.mode ?? 'deposit'];
        const meta = isGoal ? GOAL_TRANSFER : SAVINGS_TRANSFER;
        return { ...tx, title, category: meta.category, icon: meta.icon, accent: meta.accent, dateLabel, editable: false };
      }
      const category = categoryById[tx.categoryId] ?? categories.find((c) => c.type === tx.type);
      return {
        ...tx,
        title: tx.comment || category.name,
        category: category.name,
        icon: category.icon,
        accent: category.accent,
        dateLabel,
        editable: true,
      };
    };

    const transactions = state.transactions.map(describe);
    const month = monthSummary(state.transactions, state.openingBalance, today);

    const summary = {
      balance: { ...SUMMARY.balance, amount: month.balance, trend: { ...SUMMARY.balance.trend, amount: month.monthChange } },
      income: { ...SUMMARY.income, amount: month.income, trend: { percent: month.incomeTrend } },
      expenses: { ...SUMMARY.expenses, amount: month.expenses, trend: { percent: month.expensesTrend } },
    };

    // Цели с иконкой, подписью срока и остатком месяцев
    const goals = state.goals.map((g) => {
      const deadline = new Date(g.deadline);
      const done = isGoalDone(g);
      const overdue = !done && deadline < today;
      const { deadline: texts } = GOALS_PAGE;
      // У достигнутой цели о сроке напоминать незачем: «Цель достигнута» показывает сама карточка
      const deadlineLabel = overdue ? `${texts.overdue} ${formatFullDate(deadline)}` : `${texts.before} ${formatFullDate(deadline)}`;
      return { ...g, icon: CATEGORY_ICONS[g.iconId] ?? CATEGORY_ICONS.other, deadlineLabel, monthsLeft: goalMonthsLeft(g, today) };
    });

    const savings = savingsStats(state.savingsTransactions, state.savingsOpeningBalance, today, SAVINGS_PAGE.interestDay);
    const savingsTransactions = state.savingsTransactions.map((tx) => ({
      ...tx,
      title: SAVINGS_TX_TYPES[tx.type].title,
      dateLabel: formatDay(new Date(tx.date), today),
    }));

    return {
      today,
      // Исходные данные (для расчётов на экранах)
      rawTransactions: state.transactions,
      rawSavingsTransactions: state.savingsTransactions,
      savingsOpeningBalance: state.savingsOpeningBalance,
      // Готовое к показу
      transactions,
      describe,
      categories,
      expenseCategories: categories.filter((c) => c.type === 'expense'),
      incomeCategories: categories.filter((c) => c.type === 'income'),
      monthCategories: categoryBreakdown(month.monthTransactions, categories),
      summary,
      goals,
      savingsBalance: savings.balance,
      savings,
      savingsTransactions,
      // История импорта: сколько операций пакета осталось сейчас (часть могли удалить вручную)
      imports: state.imports.map((item) => ({
        ...item,
        count: state.transactions.filter((tx) => tx.importId === item.id).length,
      })),
      settings: state.settings,
      isDark,
      hideBalance: state.settings.hideBalance,
      onboardingDone: state.onboardingDone,
      isEmpty: state.transactions.length === 0 && state.goals.length === 0 && state.savingsTransactions.length === 0,
      // Действия
      addTransaction,
      addTransactions,
      undoImport,
      updateTransaction,
      deleteTransaction,
      moveSavings,
      depositToGoal,
      createGoal,
      updateGoal,
      deleteGoal,
      addCategory,
      updateCategory,
      deleteCategory,
      setSetting,
      setHideBalance,
      resetDemo,
      startFromScratch,
      completeOnboarding,
    };
  }, [
    state,
    isDark,
    addTransaction,
    addTransactions,
    undoImport,
    updateTransaction,
    deleteTransaction,
    moveSavings,
    depositToGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    addCategory,
    updateCategory,
    deleteCategory,
    setSetting,
    setHideBalance,
    resetDemo,
    startFromScratch,
    completeOnboarding,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// Хук для доступа к общим финансовым данным
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance нужно вызывать внутри FinanceProvider');
  return context;
};
