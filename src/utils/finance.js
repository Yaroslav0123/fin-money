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
  toDateInputValue,
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
 * Границы периода для списка операций. periodId — 'all' | 'month' | 'prev' | 'quarter' | 'year' | 'custom';
 * custom — { from, to } в формате <input type="date"> (любая граница может быть пустой).
 * Возвращает { start, end } (end не включительно; null — без границы) или null — без ограничений.
 * «3 месяца» и «12 месяцев» — считая текущий месяц.
 */
export function historyRange(periodId, today, custom = {}) {
  const monthStart = startOfMonth(today);
  const nextMonth = addMonths(monthStart, 1);
  switch (periodId) {
    case 'month':
      return { start: monthStart, end: nextMonth };
    case 'prev':
      return { start: addMonths(monthStart, -1), end: monthStart };
    case 'quarter':
      return { start: addMonths(monthStart, -2), end: nextMonth };
    case 'year':
      return { start: addMonths(monthStart, -(MONTHS_IN_YEAR - 1)), end: nextMonth };
    case 'custom': {
      const parse = (value) => (value ? new Date(`${value}T00:00:00`) : null);
      const to = parse(custom.to);
      return { start: parse(custom.from), end: to ? addDays(to, 1) : null };
    }
    default:
      return null;
  }
}

// Попадает ли операция в границы historyRange
export const isInHistoryRange = (tx, range) => {
  if (!range) return true;
  const date = txDate(tx);
  return (!range.start || date >= range.start) && (!range.end || date < range.end);
};

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

// ───── Аналитика: календарь, сравнение, динамика категории ─────

// Сколько ступеней яркости у дней в календаре трат (0 — трат нет)
export const CALENDAR_LEVELS = 4;

/**
 * Календарь трат за месяц: недели по 7 дней (с пустыми клетками до первого и после последнего числа).
 * monthStart — первое число месяца, weekStart — 'mon' | 'sun'.
 * День: { date, amount, level (0…CALENDAR_LEVELS), isFuture } или null — клетка вне месяца.
 * Ступень — доля от самого дорогого дня месяца: так видно «пики», даже если траты в целом небольшие.
 */
export function spendingCalendar(transactions, monthStart, today, weekStart = 'mon') {
  const days = daysInMonth(monthStart);
  const end = addDays(monthStart, days);
  const expenses = expensesOf(inRange(transactions, monthStart, end));
  const amounts = Array(days).fill(0);
  for (const tx of expenses) amounts[txDate(tx).getDate() - 1] -= tx.amount;
  const max = Math.max(0, ...amounts);

  const cells = amounts.map((amount, i) => {
    const date = addDays(monthStart, i);
    const level = amount > 0 && max > 0 ? Math.max(1, Math.ceil((amount / max) * CALENDAR_LEVELS)) : 0;
    return { date, amount, level, isFuture: date > today };
  });
  const lead = daysBetween(startOfWeek(monthStart, weekStart), monthStart);
  const padded = [...Array(lead).fill(null), ...cells];
  while (padded.length % DAYS_IN_WEEK) padded.push(null);
  const weeks = [];
  for (let i = 0; i < padded.length; i += DAYS_IN_WEEK) weeks.push(padded.slice(i, i + DAYS_IN_WEEK));

  const active = amounts.filter((amount) => amount > 0).length;
  return { weeks, max, total: amounts.reduce((a, b) => a + b, 0), activeDays: active };
}

/**
 * Расходы по категориям за период против прошлого периода (того же отрезка, как в periodExpenses).
 * Возвращает [{ ...категория, amount, previous, diff, percent | null }] —
 * категории с тратами хотя бы в одном из двух периодов, по убыванию большей из сумм.
 * percent — null, если в прошлом периоде трат не было (рост «с нуля» в процентах не выразить).
 */
export function categoryComparison(transactions, categories, periodId, today, offset = 0, weekStart = 'mon') {
  const range = periodRange(periodId, today, offset, weekStart);
  const previous = periodRange(periodId, today, offset - 1, weekStart);
  const isCurrent = today >= range.start && today < range.end;
  const elapsedMs = isCurrent ? today - range.start : range.end - range.start;
  const current = expensesOf(inRange(transactions, range.start, range.end));
  const before = expensesOf(inRange(transactions, previous.start, sameElapsedEnd(previous.start, elapsedMs, previous.end)));
  const spentIn = (items, id) => 0 - sum(items.filter((tx) => tx.categoryId === id));

  return categories
    .filter((c) => c.type === 'expense')
    .map((c) => {
      const amount = spentIn(current, c.id);
      const prev = spentIn(before, c.id);
      return { ...c, amount, previous: prev, diff: amount - prev, percent: prev > 0 ? Math.round((amount / prev - 1) * 100) : null };
    })
    .filter((c) => c.amount > 0 || c.previous > 0)
    .sort((a, b) => Math.max(b.amount, b.previous) - Math.max(a.amount, a.previous));
}

/**
 * Траты категории по месяцам за последние months месяцев, заканчивая текущим.
 * Возвращает { bars: [{ label, value }], average } — среднее по полным месяцам (без текущего), до рубля.
 * Месяцы до самой первой операции в истории в среднее не входят: данных тогда ещё не было, это не «ноль трат».
 */
export function categoryHistory(transactions, categoryId, today, months = 6) {
  const first = addMonths(startOfMonth(today), -(months - 1));
  const earliest = transactions.reduce((min, tx) => Math.min(min, txDate(tx).getTime()), Infinity);
  const historyStart = Number.isFinite(earliest) ? startOfMonth(new Date(earliest)) : startOfMonth(today);
  const bars = Array.from({ length: months }, (_, i) => {
    const start = addMonths(first, i);
    const items = expensesOf(inRange(transactions, start, addMonths(start, 1))).filter((tx) => tx.categoryId === categoryId);
    return { label: monthShort(start), value: 0 - sum(items), start };
  });
  const full = bars.slice(0, -1).filter((bar) => bar.start >= historyStart);
  const average = full.length ? Math.round(full.reduce((total, bar) => total + bar.value, 0) / full.length / KOPECKS_IN_RUBLE) * KOPECKS_IN_RUBLE : 0;
  return { bars: bars.map(({ label, value }) => ({ label, value })), average };
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

// За сколько последних месяцев считаем темп пополнения цели
const GOAL_PACE_MONTHS = 3;

/**
 * Прогноз цели по темпу пополнений за последние GOAL_PACE_MONTHS месяцев
 * (пополнения минус возвраты на основной счёт — операции kind: 'goal' с её goalId).
 * Возвращает { status: 'done' } | { status: 'noPace' } |
 * { status: 'forecast', pace (в месяц), date (примерная дата), onTime (успеет к сроку) }.
 */
export function goalForecast(goal, transactions, today) {
  if (isGoalDone(goal)) return { status: 'done' };
  const since = addMonths(startOfDay(today), -GOAL_PACE_MONTHS);
  // Перевод на цель уменьшает основной счёт, поэтому сумма отрицательная; возврат — положительная
  const moved = 0 - sum(inRange(transactions, since, addDays(startOfDay(today), 1)).filter((tx) => tx.kind === 'goal' && tx.goalId === goal.id));
  const pace = moved / GOAL_PACE_MONTHS;
  if (pace <= 0) return { status: 'noPace' };
  const months = Math.ceil((goal.target - goal.saved) / pace);
  const date = addMonths(startOfMonth(today), months);
  return { status: 'forecast', pace: Math.round(pace), date, onTime: date <= new Date(goal.deadline) };
}

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

// ───── Бюджеты по категориям ─────

/**
 * Месячные лимиты категорий расходов: сколько потрачено из лимита.
 * items — операции месяца, limits — { [id категории]: лимит в копейках }, warnAt — порог в процентах.
 * status: 'ok' | 'warning' (порог пройден) | 'over' (лимит превышен). Сначала — самые «горячие».
 */
export function budgetProgress(items, categories, limits, warnAt) {
  const expenses = expensesOf(items);
  return categories
    .filter((c) => c.type === 'expense' && limits[c.id] > 0)
    .map((c) => {
      const limit = limits[c.id];
      const amount = 0 - sum(expenses.filter((tx) => tx.categoryId === c.id));
      const percent = toPercent(amount, limit);
      const status = amount > limit ? 'over' : percent >= warnAt ? 'warning' : 'ok';
      return { ...c, limit, spent: amount, left: limit - amount, percent, status };
    })
    .sort((a, b) => b.percent - a.percent);
}

// Сколько в среднем уходит на категорию за полный месяц (последние months месяцев) — подсказка для лимита
export function averageMonthlySpend(transactions, categoryId, today, months = INSIGHT_LOOKBACK_MONTHS) {
  const end = startOfMonth(today);
  const items = inRange(transactions, addMonths(end, -months), end).filter((tx) => tx.categoryId === categoryId);
  return Math.round(spent(items) / months / KOPECKS_IN_RUBLE) * KOPECKS_IN_RUBLE;
}

// ───── Сверка с банком ─────

// День операции (по местному времени) для поиска повторов: «2026-10-28»
const dayKey = (tx) => toDateInputValue(txDate(tx));
const normalizeComment = (text) => (text ?? '').trim().toLowerCase();

/**
 * Сверка счёта с остатком из банка на конец дня date.
 * account — { id, openingBalance }, bankBalance — остаток в банке (копейки).
 * Возвращает:
 *   appBalance — баланс в Fin Money на конец того же дня (операции позже даты не учитываются),
 *   difference — банк минус Fin Money (больше нуля — в банке денег больше),
 *   duplicates — возможные повторы: группы операций с одной суммой, днём и описанием,
 *   suspects — операции, сумма которых ровно объясняет разницу (их стоит проверить первыми),
 *   lastDate — дата последней операции счёта до даты сверки (после неё операций может не хватать),
 *   laterCount — сколько операций позже даты сверки.
 */
export function reconcileAccount({ account, transactions, date, bankBalance }) {
  const end = addDays(startOfDay(date), 1);
  const own = transactions.filter((tx) => tx.accountId === account.id);
  const counted = own.filter((tx) => txDate(tx) < end);
  const appBalance = account.openingBalance + sum(counted);
  const difference = bankBalance - appBalance;

  const groups = new Map();
  for (const tx of counted) {
    const key = `${dayKey(tx)}|${tx.amount}|${normalizeComment(tx.comment)}`;
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }
  const duplicates = [...groups.values()].filter((group) => group.length > 1);

  // Лишняя операция в Fin Money даёт разницу «минус её сумма»
  const suspects = difference === 0 ? [] : counted.filter((tx) => tx.amount === -difference);
  const latest = counted.reduce((last, tx) => (!last || txDate(tx) > last ? txDate(tx) : last), null);

  return {
    appBalance,
    difference,
    matches: difference === 0,
    duplicates,
    suspects,
    lastDate: latest,
    laterCount: own.length - counted.length,
  };
}

// ───── Уведомления (колокольчик в шапке) ─────

const SOON_DAYS = 30;
const RECENT_DAYS = 7;

/**
 * Список событий для панели уведомлений: бюджет почти исчерпан, лимиты категорий,
 * срок цели скоро, крупные траты за последнюю неделю.
 * categoryBudgets — результат budgetProgress.
 */
export function notificationData({ transactions, goals, monthSpent, budgetLimit, warnAt, categoryBudgets = [], largeAmount, today }) {
  const items = [];
  const budgetPercent = toPercent(monthSpent, budgetLimit);
  if (budgetPercent >= warnAt) items.push({ id: 'budget', kind: 'budget', percent: budgetPercent });

  categoryBudgets
    .filter((budget) => budget.status !== 'ok')
    .forEach((budget) => items.push({ id: `budget-${budget.id}`, kind: 'categoryBudget', budget }));

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
