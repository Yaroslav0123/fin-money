import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createDemoData, createEmptyData } from '../data/demoData.js';
import {
  CATEGORY_BUDGETS,
  CATEGORY_ICONS,
  GOALS_PAGE,
  IMPORT_FALLBACK_INCOME,
  IMPORT_TRANSFER,
  SETTINGS_PAGE,
  SUMMARY,
} from '../data/mockData.js';
import { formatFullDate, formatTransactionDate } from '../utils/dates.js';
import { budgetProgress, categoryBreakdown, goalMonthsLeft, isGoalDone, monthSummary } from '../utils/finance.js';
import { fillTemplate, setDisplayCurrency } from '../utils/format.js';
import { applyCategoryChoice, signedDraftAmount, TRANSFER_CHOICE } from '../utils/statement.js';
import { clearFinanceState, loadFinanceState, saveFinanceState } from './financeStorage.js';
import { CURRENT_VERSION } from './migrations.js';

/*
 * Общее состояние финансов для всего приложения.
 * Хранится история операций с датами, а всё, что видно на экранах (баланс, доходы и расходы
 * за месяц, категории, графики), считается из неё — см. utils/finance.js.
 * Это прототип без сервера: данные сохраняются в localStorage этого браузера,
 * resetDemo() заново строит демо-историю от сегодняшнего дня, startFromScratch() — очищает всё.
 * Все суммы — целые копейки (utils/money.js). Счетов может быть несколько: у каждой операции есть accountId,
 * общий баланс — сумма счетов. Первый счёт основной (на него попадают операции, добавленные вручную), его нельзя удалить.
 * Цели — план, а не счёт: пополнение цели — отметка в её истории (contributions), баланс счетов оно не меняет.
 * Перевод из выписки на свой вклад можно засчитать в цель — тогда отметка связана с операцией (txId).
 * budgets — месячные лимиты категорий расходов: { [id категории]: лимит в копейках }.
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
// imports — история загруженных выписок: { id, fileName, date (ISO), count };
// categoryRules — «запомнить для похожих»: { key (ключ магазина), value (id категории или 'transfer'), label (пример описания) }.
const buildState = (data, settings = DEFAULT_SETTINGS, onboardingDone = false) => ({
  version: CURRENT_VERSION,
  budgets: {},
  ...data,
  imports: [],
  categoryRules: [],
  settings,
  onboardingDone,
  nextId: FIRST_ID,
});

// Сохранённое состояние (уже в текущем формате, см. migrations.js) дополняем полями и настройками,
// появившимися в новых версиях: у них есть значение по умолчанию, поэтому отдельный шаг миграции не нужен
const restoreState = () => {
  const saved = loadFinanceState();
  if (!saved) return buildState(createDemoData());
  return { imports: [], categoryRules: [], budgets: {}, ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
};

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
const sumAmounts = (items) => items.reduce((total, item) => total + item.amount, 0);
// Основной счёт — первый в списке
const primaryAccountId = (state) => state.accounts[0].id;
// Счёт из черновика, если он есть, иначе основной
const accountOf = (state, accountId) => (state.accounts.some((a) => a.id === accountId) ? accountId : primaryAccountId(state));

// Пополнение цели: сумма растёт, отметка попадает в историю цели (по ней считается темп)
const addContribution = (goal, contribution) => ({
  ...goal,
  saved: goal.saved + contribution.amount,
  contributions: [contribution, ...(goal.contributions ?? [])],
});

// Цели без отметок, связанных с удалёнными операциями из выписки (txIds — Set id операций)
const withoutTxContributions = (goals, txIds) =>
  goals.map((goal) => {
    const removed = (goal.contributions ?? []).filter((c) => c.txId && txIds.has(c.txId));
    if (removed.length === 0) return goal;
    return {
      ...goal,
      saved: Math.max(0, goal.saved - sumAmounts(removed)),
      contributions: goal.contributions.filter((c) => !removed.includes(c)),
    };
  });

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

// Лимиты без одной категории
const withoutBudget = (budgets, categoryId) => Object.fromEntries(Object.entries(budgets).filter(([id]) => id !== categoryId));

// Новые правила заменяют старые для тех же магазинов
const mergeRules = (rules, added) => [...added, ...rules.filter((rule) => !added.some((a) => a.key === rule.key))];

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

  // draft — { type: 'income' | 'expense', amount (положительное, в копейках), categoryId, comment, date?, accountId? }
  const addTransaction = useCallback(
    (draft) =>
      update((prev, newId) => {
        const tx = {
          id: newId('tx'),
          accountId: accountOf(prev, draft.accountId),
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
   * rules — правила «запомнить для похожих», выбранные в предпросмотре; accountId — счёт, чья это выписка.
   */
  const addTransactions = useCallback(
    (drafts, { fileName = '', rules = [], accountId } = {}) =>
      update((prev, newId) => {
        const importId = newId('import');
        const account = accountOf(prev, accountId);
        const added = drafts.map((draft) => {
          const base = {
            id: newId('tx'),
            accountId: account,
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
          imports: [{ id: importId, accountId: account, fileName, date: new Date().toISOString(), count: added.length }, ...prev.imports],
          categoryRules: mergeRules(prev.categoryRules, rules),
        };
      }),
    [update],
  );

  /*
   * Разбор «Другого»: changes — [{ ids, value }] (value — id категории или 'transfer'), rules — что запомнить.
   * Поступление в категории расходов становится возвратом, перевод — переводом между своими счетами.
   */
  const recategorize = useCallback(
    (changes, rules = []) =>
      update((prev) => {
        const valueById = new Map(changes.flatMap(({ ids, value }) => ids.map((id) => [id, value])));
        const hasFallback = prev.categories.some((c) => c.id === IMPORT_FALLBACK_INCOME.id);
        const categories = hasFallback ? prev.categories : [...prev.categories, IMPORT_FALLBACK_INCOME];
        const needsFallback = !hasFallback && changes.some((change) => change.value === IMPORT_FALLBACK_INCOME.id);
        return {
          ...prev,
          categories: needsFallback ? categories : prev.categories,
          transactions: prev.transactions.map((tx) => {
            if (!valueById.has(tx.id) || tx.type === 'transfer') return tx;
            const value = valueById.get(tx.id);
            if (value === TRANSFER_CHOICE) return { ...tx, type: 'transfer', kind: 'import', categoryId: undefined };
            const { type, categoryId } = applyCategoryChoice({ type: tx.type, categoryId: tx.categoryId, incoming: tx.amount > 0 }, value, categories);
            return { ...tx, type, categoryId };
          }),
          categoryRules: mergeRules(prev.categoryRules, rules),
        };
      }),
    [update],
  );

  const deleteCategoryRule = useCallback(
    (key) => update((prev) => ({ ...prev, categoryRules: prev.categoryRules.filter((rule) => rule.key !== key) })),
    [update],
  );

  // Отмена импорта: удаляются все операции пакета, в том числе изменённые после загрузки,
  // и их суммы в целях, если переводы из этой выписки были засчитаны в цели
  const undoImport = useCallback(
    (importId) =>
      update((prev) => {
        const removed = new Set(prev.transactions.filter((tx) => tx.importId === importId).map((tx) => tx.id));
        return {
          ...prev,
          transactions: prev.transactions.filter((tx) => !removed.has(tx.id)),
          imports: prev.imports.filter((item) => item.id !== importId),
          goals: withoutTxContributions(prev.goals, removed),
        };
      }),
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
                  accountId: accountOf(prev, draft.accountId ?? tx.accountId),
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

  // Удаление операции. Если это перевод, засчитанный в цель, его сумма уходит и из цели.
  const deleteTransaction = useCallback(
    (id) =>
      update((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        goals: withoutTxContributions(prev.goals, new Set([id])),
      })),
    [update],
  );

  // ───── Цели ─────

  // «Отложить» на цель — отметка для учёта: цель растёт, баланс счетов не меняется
  const depositToGoal = useCallback(
    (goal, amount) =>
      update((prev, newId) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goal.id ? addContribution(g, { id: newId('contribution'), amount, date: new Date().toISOString() }) : g,
        ),
      })),
    [update],
  );

  /*
   * Перевод из выписки (на свой вклад, в копилку) засчитывается в цель goalId; null — больше не засчитывается.
   * Баланс не меняется: перевод уже учтён на счёте, цель только узнаёт, что на неё отложили.
   */
  const assignTransferToGoal = useCallback(
    (txId, goalId) =>
      update((prev, newId) => {
        const tx = prev.transactions.find((t) => t.id === txId);
        if (!tx || tx.type !== 'transfer' || tx.amount >= 0) return prev;
        let goals = withoutTxContributions(prev.goals, new Set([txId]));
        if (goalId) {
          const contribution = { id: newId('contribution'), amount: -tx.amount, date: tx.date, txId };
          goals = goals.map((g) => (g.id === goalId ? addContribution(g, contribution) : g));
        }
        // undefined не попадает в сохранённый JSON — связь с целью просто исчезает
        const transactions = prev.transactions.map((t) => (t.id === txId ? { ...t, goalId: goalId ?? undefined } : t));
        return { ...prev, goals, transactions };
      }),
    [update],
  );

  // draft — { name, target, deadline (Date), iconId, accent }
  const createGoal = useCallback(
    (draft) =>
      update((prev, newId) => ({
        ...prev,
        goals: [...prev.goals, { ...draft, deadline: draft.deadline.toISOString(), id: newId('goal'), saved: 0, contributions: [] }],
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

  // Удаление цели вместе с её отметками. Баланс не меняется; переводы, засчитанные в неё, остаются обычными переводами.
  const deleteGoal = useCallback(
    (id) =>
      update((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
        transactions: prev.transactions.map((tx) => (tx.goalId === id ? { ...tx, goalId: undefined } : tx)),
      })),
    [update],
  );

  // ───── Счета ─────

  // draft — { name, openingBalance (копейки, может быть отрицательным — кредитная карта) }.
  // Сверка с банком хранится в счёте: reconciliation — { date (ISO), bankBalance (копейки) }
  const addAccount = useCallback(
    (draft) => update((prev, newId) => ({ ...prev, accounts: [...prev.accounts, { ...draft, id: newId('account') }] })),
    [update],
  );

  const updateAccount = useCallback(
    (id, draft) => update((prev) => ({ ...prev, accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...draft } : a)) })),
    [update],
  );

  // Удаление счёта вместе с его операциями и историей импорта. Основной счёт не удаляется:
  // на него попадают операции, добавленные вручную.
  const deleteAccount = useCallback(
    (id) =>
      update((prev) => {
        if (id === primaryAccountId(prev) || !prev.accounts.some((a) => a.id === id)) return prev;
        const removed = new Set(prev.transactions.filter((tx) => tx.accountId === id).map((tx) => tx.id));
        return {
          ...prev,
          accounts: prev.accounts.filter((a) => a.id !== id),
          transactions: prev.transactions.filter((tx) => !removed.has(tx.id)),
          imports: prev.imports.filter((item) => item.accountId !== id),
          goals: withoutTxContributions(prev.goals, removed),
        };
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

  // Удаление категории: её операции переходят в запасную категорию того же типа, правила и лимит на неё удаляются
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
          categoryRules: prev.categoryRules.filter((rule) => rule.value !== id),
          budgets: withoutBudget(prev.budgets, id),
        };
      }),
    [update],
  );

  // Месячный лимит категории расходов (копейки); 0 или null — убрать лимит
  const setCategoryBudget = useCallback(
    (categoryId, limit) =>
      update((prev) => {
        const rest = withoutBudget(prev.budgets, categoryId);
        return { ...prev, budgets: limit > 0 ? { ...rest, [categoryId]: limit } : rest };
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

  // Пустой аккаунт: без операций и целей
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

    // Счета с текущим балансом: начальный остаток + все операции счёта
    const accounts = state.accounts.map((account, index) => {
      const own = state.transactions.filter((tx) => tx.accountId === account.id);
      return { ...account, isPrimary: index === 0, balance: account.openingBalance + sumAmounts(own), count: own.length };
    });
    const accountName = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
    const openingBalance = state.accounts.reduce((total, a) => total + a.openingBalance, 0);
    const goalNames = Object.fromEntries(state.goals.map((g) => [g.id, g.name]));

    // Операция в виде для списков: иконка, цвет, заголовок, подпись категории и даты
    const describeTx = (tx) => {
      const date = new Date(tx.date);
      const dateLabel = formatTransactionDate(date, today);
      // Перевод между своими счетами из выписки; засчитанный в цель подписан её названием
      if (tx.type === 'transfer') {
        const { icon, accent } = IMPORT_TRANSFER;
        const goalName = tx.goalId ? goalNames[tx.goalId] : null;
        const category = goalName ? fillTemplate(IMPORT_TRANSFER.goalCategory, { name: goalName }) : IMPORT_TRANSFER.category;
        return { ...tx, title: tx.comment || IMPORT_TRANSFER.title, category, icon, accent, dateLabel, editable: false };
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
    // …и название счёта: accountName — для выгрузки, accountBadge — для списков, когда счетов больше одного
    const describe = (tx) => {
      const name = accountName[tx.accountId] ?? '';
      return { ...describeTx(tx), accountName: name, accountBadge: accounts.length > 1 ? name : '' };
    };

    const transactions = state.transactions.map(describe);
    const month = monthSummary(state.transactions, openingBalance, today);

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

    return {
      today,
      // Исходные данные (для расчётов на экранах)
      rawTransactions: state.transactions,
      // Готовое к показу
      transactions,
      describe,
      categories,
      accounts,
      expenseCategories: categories.filter((c) => c.type === 'expense'),
      incomeCategories: categories.filter((c) => c.type === 'income'),
      monthCategories: categoryBreakdown(month.monthTransactions, categories),
      // Лимиты категорий: как заданы (budgetLimits) и сколько из них потрачено за текущий месяц (budgets)
      budgetLimits: state.budgets,
      budgets: budgetProgress(month.monthTransactions, categories, state.budgets, CATEGORY_BUDGETS.warnAt),
      summary,
      goals,
      // История импорта: сколько операций пакета осталось сейчас (часть могли удалить вручную)
      imports: state.imports.map((item) => ({
        ...item,
        count: state.transactions.filter((tx) => tx.importId === item.id).length,
        accountBadge: accounts.length > 1 ? accountName[item.accountId] ?? '' : '',
      })),
      // Правила «запомнить для похожих» с названием категории для показа
      categoryRules: state.categoryRules.map((rule) => ({
        ...rule,
        categoryName: rule.value === TRANSFER_CHOICE ? IMPORT_TRANSFER.title : categoryById[rule.value]?.name ?? '',
      })),
      settings: state.settings,
      isDark,
      hideBalance: state.settings.hideBalance,
      onboardingDone: state.onboardingDone,
      isEmpty: state.transactions.length === 0 && state.goals.length === 0,
      // Действия
      addTransaction,
      addTransactions,
      undoImport,
      recategorize,
      deleteCategoryRule,
      updateTransaction,
      deleteTransaction,
      depositToGoal,
      assignTransferToGoal,
      createGoal,
      updateGoal,
      deleteGoal,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      setCategoryBudget,
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
    recategorize,
    deleteCategoryRule,
    updateTransaction,
    deleteTransaction,
    depositToGoal,
    assignTransferToGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoryBudget,
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
