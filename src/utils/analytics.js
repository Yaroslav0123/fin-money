import { toPercent } from './format.js';

/*
 * Учёт расходов, добавленных пользователем через «Добавить операцию».
 * addedExpenses — массив { categoryId, amount } с положительными суммами.
 * В прототипе «сегодня» — последний день любого периода (31 мая).
 */

// Сумма добавленных расходов
export const sumExpenses = (addedExpenses) => addedExpenses.reduce((sum, e) => sum + e.amount, 0);

// Прибавляем новые траты к суммам категорий и пересчитываем доли
export const addExpensesToCategories = (categories, addedExpenses, total) => {
  if (addedExpenses.length === 0) return categories;
  return categories.map((c) => {
    const amount = c.amount + sumExpenses(addedExpenses.filter((e) => e.categoryId === c.id));
    return { ...c, amount, share: toPercent(amount, total) };
  });
};

// Столбцы периода «День» — по 2 часа, поэтому номер столбца = час / 2
const HOURS_PER_DAY_BAR = 2;
const todayBarIndex = (period) =>
  period.id === 'day' ? Math.floor(new Date().getHours() / HOURS_PER_DAY_BAR) : period.bars.length - 1;

// Динамика к прошлому периоду с новым итогом.
// Сумму прошлого периода восстанавливаем из исходных итога и процента.
const PERCENT = 100;
const recalcTrendPercent = (baseTotal, basePercent, newTotal) => {
  const previousTotal = baseTotal / (1 + basePercent / PERCENT);
  return Math.round((newTotal / previousTotal - 1) * PERCENT);
};

// Период аналитики с учётом новых трат: итог, «сегодняшний» столбец и динамика
export const applyExpensesToPeriod = (period, addedExpenses) => {
  const extra = sumExpenses(addedExpenses);
  if (extra === 0) return period;
  const targetIndex = todayBarIndex(period);
  const total = period.total + extra;
  return {
    ...period,
    total,
    trend: { ...period.trend, percent: recalcTrendPercent(period.total, period.trend.percent, total) },
    bars: period.bars.map((bar, index) => (index === targetIndex ? { ...bar, value: bar.value + extra } : bar)),
  };
};
