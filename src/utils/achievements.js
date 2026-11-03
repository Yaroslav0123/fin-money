/*
 * Достижения и серия «в ритме»: прогресс считает utils/finance.js, здесь — сборка списка с текстами из mockData.
 */
import { ACHIEVEMENTS, DEFAULT_CATEGORIES, IMPORT_FALLBACK_INCOME } from '../data/mockData.js';
import { achievementProgress, spendingStreak } from './finance.js';

const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

/**
 * Достижения для экранов: [{ ...описание из ACHIEVEMENTS.items, current (не больше target), unlocked }]
 * и серия { current, best, noSpendDays, usual }.
 * finance — значения из useFinance(): rawTransactions, goals, imports, categories, budgetLimits, today.
 */
export function buildAchievements({ rawTransactions, goals, imports, categories, budgetLimits, today }) {
  const progress = achievementProgress({
    transactions: rawTransactions,
    goals,
    imports,
    categories,
    limits: budgetLimits,
    defaultCategoryIds: DEFAULT_CATEGORY_IDS,
    fallbackIncomeId: IMPORT_FALLBACK_INCOME.id,
    today,
  });
  const items = ACHIEVEMENTS.items.map((item) => {
    const value = progress[item.id] ?? 0;
    return { ...item, current: Math.min(value, item.target), unlocked: value >= item.target };
  });
  return { items, streak: spendingStreak(rawTransactions, today) };
}
