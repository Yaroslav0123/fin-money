/*
 * Расчёты по истории операций: всё, что показывают экраны, считается отсюда.
 * Суммы — в копейках. Операция счёта: { id, accountId, type: 'income' | 'expense' | 'transfer', amount (со знаком), date (ISO), ... }.
 * Операция накопительного счёта: { id, type: 'deposit' | 'interest' | 'withdraw', amount (со знаком), date }.
 * Функции чистые: получают данные и «сегодня», ничего не меняют.
 */
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  formatDateRange,
  formatMonthRange,
  isInRange,
  monthsBetween,
  monthShort,
  startOfDay,
  startOfMonth,
  startOfWeek,
  weekdayShort,
} from './dates.js';
import { toPercent } from './format.js';
import { KOPECKS_IN_RUBLE } from './money.js';

const HOURS_PER_DAY_BAR = 2;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;

const txDate = (tx) => new Date(tx.date);
const sum = (items) => items.reduce((total, item) => total + item.amount, 0);
const inRange = (items, start, end) => items.filter((tx) => isInRange(txDate(tx), start, end));
const expensesOf = (items) => items.filter((tx) => tx.type === 'expense');
const incomeOf = (items) => items.filter((tx) => tx.type === 'income');

// Сумма расходов положительным числом. «0 −», а не унарный минус: иначе без трат получится −0
const spent = (items) => 0 - sum(expensesOf(items));

// Конец «того же отрезка» прошлого периода: столько же времени от его начала, но не дальше его конца.
// Без ограничения 31 октября «те же дни сентября» захватили бы 1 октября.
const sameElapsedEnd = (start, elapsedMs, limit) => new Date(Math.min(start.getTime() + elapsedMs, limit.getTime()));

// ───── Периоды аналитики ─────

/**
 * Границы периода. periodId — 'day' | 'week' | 'month' | 'year';
 * offset — сдвиг назад (-1 — предыдущий период), weekStart — 'mon' | 'sun'.
 * Возвращает { start, end (не включительно), label, buckets: [{ start, end, label }] }.
 * «Год» — последние 12 месяцев, заканчивая текущим.
 */
export function periodRange(periodId, today, offset = 0, weekStart = 'mon') {
  if (periodId === 'day') {
    const start = addDays(startOfDay(today), offset);
    const buckets = Array.from({ length: HOURS_IN_DAY / HOURS_PER_DAY_BAR }, (_, i) => {
      const hour = i * HOURS_PER_DAY_BAR;
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour);
      return { start: from, end: new Date(from.getTime() + HOURS_PER_DAY_BAR * 3600 * 1000), label: `${String(hour).padStart(2, '0')}:00` };
    });
    return { start, end: addDays(start, 1), label: formatDateRange(start, start), buckets };
  }

  if (periodId === 'week') {
    const start = addDays(startOfWeek(today, weekStart), offset * DAYS_IN_WEEK);
    const buckets = Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
      const day = addDays(start, i);
      return { start: day, end: addDays(day, 1), label: weekdayShort(day) };
    });
    return { start, end: addDays(start, DAYS_IN_WEEK), label: formatDateRange(start, addDays(start, DAYS_IN_WEEK - 1)), buckets };
  }

  if (periodId === 'month') {
    const start = startOfMonth(addMonths(startOfMonth(today), offset));
    const days = daysInMonth(start);
    const buckets = Array.from({ length: days }, (_, i) => {
      const day = addDays(start, i);
      return { start: day, end: addDays(day, 1), label: `${i + 1} ${monthShort(day).toLowerCase()}` };
    });
    return { start, end: addDays(start, days), label: formatDateRange(start, addDays(start, days - 1)), buckets };
  }

  // Год: 12 месяцев, последний — месяц «сегодня», сдвинутый на offset лет
  const lastMonth = addMonths(startOfMonth(today), offset * MONTHS_IN_YEAR);
  const start = addMonths(lastMonth, -(MONTHS_IN_YEAR - 1));
  const buckets = Array.from({ length: MONTHS_IN_YEAR }, (_, i) => {
    const month = addMonths(start, i);
    return { start: month, end: addMonths(month, 1), label: monthShort(month) };
  });
  return { start, end: addMonths(lastMonth, 1), label: formatMonthRange(start, lastMonth), buckets };
}

/**
 * Расходы за период: итог, столбцы, динамика к прошлому периоду и среднее за день.
 * Для текущего периода сравниваем с тем же отрезком прошлого (1–28 октября с 1–28 сентября),
 * а среднее считаем по прошедшим дням, а не по всему периоду.
 */
export function periodExpenses(transactions, periodId, today, offset = 0, weekStart = 'mon') {
  const range = periodRange(periodId, today, offset, weekStart);
  const previous = periodRange(periodId, today, offset - 1, weekStart);
  const isCurrent = today >= range.start && today < range.end;

  const items = inRange(transactions, range.start, range.end);
  const total = spent(items);
  const elapsedMs = isCurrent ? today - range.start : range.end - range.start;
  const previousTotal = spent(inRange(transactions, previous.start, sameElapsedEnd(previous.start, elapsedMs, previous.end)));

  const bars = range.buckets.map((bucket) => ({
    label: bucket.label,
    value: spent(inRange(items, bucket.start, bucket.end)),
  }));
  // Подсвечиваем «сейчас» в текущем периоде и последний столбец в прошлых
  const highlightIndex = isCurrent ? range.buckets.findIndex((b) => isInRange(today, b.start, b.end)) : bars.length - 1;
  const elapsedDays = Math.max(1, isCurrent ? daysBetween(range.start, today) + 1 : daysBetween(range.start, range.end));

  return {
    ...range,
    isCurrent,
    total,
    trend: { percent: previousTotal > 0 ? Math.round((total / previousTotal - 1) * 100) : 0 },
    hasPrevious: previousTotal > 0,
    // Среднее — до рубля: копейки в нём ничего не говорят
    perDay: Math.round(total / elapsedDays / KOPECKS_IN_RUBLE) * KOPECKS_IN_RUBLE,
    bars,
    highlightIndex,
    transactions: items,
  };
}

/**
 * Расходы по категориям за набор операций.
 * categories — список категорий (с иконками); возвращает только категории с тратами,
 * от крупной к мелкой, с долей в процентах.
 */
export function categoryBreakdown(items, categories) {
  const expenses = expensesOf(items);
  const total = spent(expenses);
  return categories
    .filter((c) => c.type === 'expense')
    .map((c) => {
      const amount = 0 - sum(expenses.filter((tx) => tx.categoryId === c.id));
      return { ...c, amount, share: toPercent(amount, total) };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

// Доходы и расходы по месяцам за последние months месяцев (для сравнительной диаграммы)
export function incomeVsExpenses(transactions, today, months = 6) {
  const first = addMonths(startOfMonth(today), -(months - 1));
  return Array.from({ length: months }, (_, i) => {
    const start = addMonths(first, i);
    const items = inRange(transactions, start, addMonths(start, 1));
    return { label: monthShort(start), income: sum(incomeOf(items)), expenses: spent(items) };
  });
}

// ───── Сводка для «Главной» ─────

/**
 * Баланс и показатели текущего месяца.
 * Динамика доходов и расходов — к тому же отрезку прошлого месяца,
 * динамика баланса — его изменение с начала месяца.
 */
export function monthSummary(transactions, openingBalance, today) {
  const monthStart = startOfMonth(today);
  const previousStart = addMonths(monthStart, -1);
  const previousEnd = sameElapsedEnd(previousStart, today - monthStart, monthStart);

  const month = inRange(transactions, monthStart, addDays(startOfDay(today), 1));
  const previous = inRange(transactions, previousStart, previousEnd);

  const trendPercent = (current, before) => (before > 0 ? Math.round((current / before - 1) * 100) : 0);
  const income = sum(incomeOf(month));
  const expenses = spent(month);

  return {
    balance: openingBalance + sum(transactions),
    monthChange: sum(month),
    income,
    expenses,
    incomeTrend: trendPercent(income, sum(incomeOf(previous))),
    expensesTrend: trendPercent(expenses, spent(previous)),
    monthTransactions: month,
  };
}

// ───── Подсказки на «Аналитике» ─────

const INSIGHT_LOOKBACK_MONTHS = 3;
// Насколько траты в выходные должны отличаться от будних, чтобы об этом сказать
const WEEKEND_RATIO_THRESHOLD = 1.15;

/**
 * Данные для подсказок (тексты собирает экран):
 * сравнение с прошлым месяцем, крупнейшая категория, выходные против будней, ближайшая цель.
 */
export function insightData(transactions, categories, goals, today) {
  const summary = monthSummary(transactions, 0, today);
  const monthStart = startOfMonth(today);
  const previousEnd = sameElapsedEnd(addMonths(monthStart, -1), today - monthStart, monthStart);
  const previousSpent = spent(inRange(transactions, addMonths(monthStart, -1), previousEnd));

  const top = categoryBreakdown(summary.monthTransactions, categories)[0] ?? null;

  // Средние траты за выходной и будний день за последние месяцы
  const lookbackStart = addMonths(startOfDay(today), -INSIGHT_LOOKBACK_MONTHS);
  const recent = expensesOf(inRange(transactions, lookbackStart, today));
  let weekendDays = 0;
  let weekDays = 0;
  for (let day = lookbackStart; day < today; day = addDays(day, 1)) {
    if (day.getDay() === 0 || day.getDay() === 6) weekendDays += 1;
    else weekDays += 1;
  }
  const isWeekendTx = (tx) => [0, 6].includes(txDate(tx).getDay());
  const weekendAvg = weekendDays ? (0 - sum(recent.filter(isWeekendTx))) / weekendDays : 0;
  const weekdayAvg = weekDays ? (0 - sum(recent.filter((tx) => !isWeekendTx(tx)))) / weekDays : 0;
  const weekendRatio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0;

  // Ближайшая по сроку незавершённая цель
  const nextGoal =
    goals
      .filter((g) => !isGoalDone(g))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .map((g) => ({ ...g, left: g.target - g.saved, monthsLeft: goalMonthsLeft(g, today) }))[0] ?? null;

  return {
    monthSpent: summary.expenses,
    hasPreviousMonth: previousSpent > 0,
    monthDiff: summary.expenses - previousSpent,
    topCategory: top,
    weekendRatio: weekendRatio >= WEEKEND_RATIO_THRESHOLD || (weekendRatio > 0 && weekendRatio <= 1 / WEEKEND_RATIO_THRESHOLD) ? weekendRatio : null,
    nextGoal,
  };
}

// ───── Цели ─────

export const isGoalDone = (goal) => goal.saved >= goal.target;

// Сколько полных месяцев осталось до срока цели (не меньше 0)
export const goalMonthsLeft = (goal, today) => Math.max(0, monthsBetween(today, new Date(goal.deadline)));

// ───── Накопительный счёт ─────

/**
 * Баланс накоплений по точкам периода: 'week' — 7 последних дней, 'month' — дни текущего месяца,
 * 'year' — 12 последних месяцев. Значение точки — баланс на конец дня / месяца.
 */
export function savingsSeries(savingsTransactions, openingBalance, periodId, today) {
  const balanceAt = (moment) => openingBalance + sum(savingsTransactions.filter((tx) => txDate(tx) < moment));
  const tomorrow = addDays(startOfDay(today), 1);

  if (periodId === 'year') {
    const first = addMonths(startOfMonth(today), -(MONTHS_IN_YEAR - 1));
    return Array.from({ length: MONTHS_IN_YEAR }, (_, i) => {
      const month = addMonths(first, i);
      const end = i === MONTHS_IN_YEAR - 1 ? tomorrow : addMonths(month, 1);
      return { label: monthShort(month), value: balanceAt(end) };
    });
  }

  const days = periodId === 'week' ? DAYS_IN_WEEK : daysBetween(startOfMonth(today), today) + 1;
  const first = addDays(startOfDay(today), -(days - 1));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(first, i);
    const label = periodId === 'week' ? weekdayShort(day) : `${day.getDate()} ${monthShort(day).toLowerCase()}`;
    return { label, value: balanceAt(addDays(day, 1)) };
  });
}

/**
 * Показатели накопительного счёта: баланс, изменение за месяц,
 * проценты за текущий месяц и за всё время, дата следующего начисления.
 */
export function savingsStats(savingsTransactions, openingBalance, today, interestDay) {
  const monthStart = startOfMonth(today);
  const month = inRange(savingsTransactions, monthStart, addDays(startOfDay(today), 1));
  const interest = savingsTransactions.filter((tx) => tx.type === 'interest');
  const thisMonthInterestDay = new Date(today.getFullYear(), today.getMonth(), interestDay);
  const nextInterest = today < thisMonthInterestDay ? thisMonthInterestDay : addMonths(thisMonthInterestDay, 1);

  return {
    balance: openingBalance + sum(savingsTransactions),
    monthChange: sum(month),
    monthInterest: sum(month.filter((tx) => tx.type === 'interest')),
    totalInterest: sum(interest),
    nextInterest,
  };
}

// ───── Уведомления (колокольчик в шапке) ─────

const SOON_DAYS = 30;
const RECENT_DAYS = 7;

/**
 * Список событий для панели уведомлений: бюджет почти исчерпан,
 * срок цели скоро, крупные траты за последнюю неделю.
 */
export function notificationData({ transactions, goals, monthSpent, budgetLimit, warnAt, largeAmount, today }) {
  const items = [];
  const budgetPercent = toPercent(monthSpent, budgetLimit);
  if (budgetPercent >= warnAt) items.push({ id: 'budget', kind: 'budget', percent: budgetPercent });

  goals
    .filter((g) => !isGoalDone(g))
    .forEach((g) => {
      const days = daysBetween(today, new Date(g.deadline));
      if (days >= 0 && days <= SOON_DAYS) items.push({ id: `goal-${g.id}`, kind: 'goal', goal: g, days });
    });

  expensesOf(inRange(transactions, addDays(startOfDay(today), -RECENT_DAYS), addDays(startOfDay(today), 1)))
    .filter((tx) => -tx.amount >= largeAmount)
    .forEach((tx) => items.push({ id: `large-${tx.id}`, kind: 'large', transaction: tx }));

  return items;
}
