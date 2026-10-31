/*
 * Расчёты по истории операций: всё, что показывают экраны, считается отсюда.
 * Суммы — в копейках. Операция счёта: { id, accountId, type: 'income' | 'expense' | 'transfer', amount (со знаком), date (ISO), ... }.
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

// Средний темп пополнения цели в месяц: отметки «отложил» и засчитанные переводы за последние GOAL_PACE_MONTHS месяцев
export function goalPace(goal, today) {
  const since = addMonths(startOfDay(today), -GOAL_PACE_MONTHS);
  return sum(inRange(goal.contributions ?? [], since, addDays(startOfDay(today), 1))) / GOAL_PACE_MONTHS;
}

/**
 * Прогноз цели по темпу пополнений (goal.contributions — [{ amount, date }]).
 * Возвращает { status: 'done' } | { status: 'noPace' } |
 * { status: 'forecast', pace (в месяц), date (примерная дата), onTime (успеет к сроку) }.
 */
export function goalForecast(goal, today) {
  if (isGoalDone(goal)) return { status: 'done' };
  const pace = goalPace(goal, today);
  if (pace <= 0) return { status: 'noPace' };
  const months = Math.ceil((goal.target - goal.saved) / pace);
  const date = addMonths(startOfMonth(today), months);
  return { status: 'forecast', pace: Math.round(pace), date, onTime: date <= new Date(goal.deadline) };
}

/**
 * На сколько месяцев раньше будет достигнута цель, если откладывать на extra больше в месяц.
 * pace — нынешний темп в месяц; без темпа сравниваем «никогда» нельзя — тогда null.
 */
export function goalSpeedup(goal, pace, extra) {
  const left = goal.target - goal.saved;
  if (left <= 0 || pace <= 0 || extra <= 0) return null;
  return Math.ceil(left / pace) - Math.ceil(left / (pace + extra));
}

// ───── Прогноз месяца и советы ─────

// Сколько полных месяцев перед текущим задают «обычный» темп трат
const FORECAST_LOOKBACK_MONTHS = 3;
// Прогноз — оценка, поэтому без копеек
const toRubles = (kopecks) => Math.round(kopecks / KOPECKS_IN_RUBLE) * KOPECKS_IN_RUBLE;

// Полные месяцы перед текущим (новые — первыми), но не раньше месяца первой операции:
// до начала истории трат «нет» не потому, что их не было
const historyMonths = (transactions, today) => {
  const monthStart = startOfMonth(today);
  const first = transactions.reduce((min, tx) => (txDate(tx) < min ? txDate(tx) : min), monthStart);
  return Array.from({ length: FORECAST_LOOKBACK_MONTHS }, (_, i) => addMonths(monthStart, -(i + 1))).filter((m) => m >= startOfMonth(first));
};

/**
 * Прогноз текущего месяца: сколько ещё потратится до его конца и сколько останется от доходов.
 * Оставшиеся дни считаются по обычному темпу — средним тратам в день за полные месяцы перед текущим
 * (без истории — по темпу этого месяца). Доход — уже полученный, но не меньше обычного месячного:
 * зарплата могла ещё не прийти.
 * limits — лимиты категорий: для тех, что по прогнозу будут превышены, — примерная дата превышения.
 * Возвращает { endDate, spent, projectedExpenses, usualExpenses (null без истории), income, projectedLeft,
 * hasHistory, categories: { [id]: { spent, projected, usual } }, budgets: [{ categoryId, limit, projected, date }] }.
 */
export function monthForecast(transactions, today, limits = {}) {
  const monthStart = startOfMonth(today);
  const elapsedDays = daysBetween(monthStart, today) + 1;
  const remainingDays = daysInMonth(today) - elapsedDays;
  const current = inRange(transactions, monthStart, addDays(startOfDay(today), 1));
  const months = historyMonths(transactions, today);
  const past = months.length > 0 ? inRange(transactions, months.at(-1), monthStart) : [];
  const pastDays = months.reduce((total, month) => total + daysInMonth(month), 0);

  const forecastOf = (filter) => {
    const nowSpent = spent(current.filter(filter));
    const pastSpent = spent(past.filter(filter));
    const rate = pastDays > 0 ? pastSpent / pastDays : nowSpent / elapsedDays;
    return {
      spent: nowSpent,
      rate,
      projected: toRubles(nowSpent + rate * remainingDays),
      usual: months.length > 0 ? toRubles(pastSpent / months.length) : null,
    };
  };

  const total = forecastOf(() => true);
  const usualIncome = months.length > 0 ? toRubles(sum(incomeOf(past)) / months.length) : 0;
  const income = Math.max(sum(incomeOf(current)), usualIncome);

  const categoryIds = [...new Set(expensesOf([...current, ...past]).map((tx) => tx.categoryId))];
  const categories = Object.fromEntries(categoryIds.map((id) => [id, forecastOf((tx) => tx.categoryId === id)]));

  // Лимит ещё не превышен, но к концу месяца будет: день, когда траты по обычному темпу дойдут до лимита
  const budgets = Object.entries(limits)
    .flatMap(([categoryId, limit]) => {
      const c = categories[categoryId];
      if (!c || c.rate <= 0 || c.spent >= limit || c.projected <= limit) return [];
      const date = addDays(startOfDay(today), Math.ceil((limit - c.spent) / c.rate));
      return [{ categoryId, limit, projected: c.projected, date }];
    })
    .sort((a, b) => a.date - b.date);

  return {
    endDate: new Date(today.getFullYear(), today.getMonth(), daysInMonth(today)),
    spent: total.spent,
    projectedExpenses: total.projected,
    usualExpenses: total.usual,
    income,
    projectedLeft: income - total.projected,
    hasHistory: months.length > 0,
    categories,
    budgets,
  };
}

// Рост категории считается заметным: прогноз выше обычного на GROWTH_MIN_PERCENT% и на GROWTH_MIN_AMOUNT
const GROWTH_MIN_PERCENT = 20;
const GROWTH_MIN_AMOUNT = 1000 * KOPECKS_IN_RUBLE;

// Категория, которая в этом месяце сильнее всего обгоняет свой обычный уровень (forecast — из monthForecast), или null
export function categoryGrowth(forecast, categories) {
  const grown = Object.entries(forecast.categories)
    .map(([id, c]) => ({ ...c, category: categories.find((cat) => cat.id === id), diff: c.projected - (c.usual ?? 0) }))
    .filter((c) => c.category && c.usual > 0 && c.diff >= GROWTH_MIN_AMOUNT && toPercent(c.diff, c.usual) >= GROWTH_MIN_PERCENT)
    .sort((a, b) => b.diff - a.diff)[0];
  return grown ? { ...grown, percent: toPercent(grown.diff, grown.usual) } : null;
}

// Регулярный платёж: одно описание в REGULAR_MIN_MONTHS из REGULAR_LOOKBACK_MONTHS полных месяцев,
// и суммы по месяцам отличаются не больше чем в REGULAR_SPREAD раза
const REGULAR_LOOKBACK_MONTHS = 4;
const REGULAR_MIN_MONTHS = 3;
const REGULAR_SPREAD = 1.25;

// Ключ описания: без цифр, звёздочек и регистра — номер карты и дата в тексте выписки не мешают
const descriptionKey = (text) =>
  (text ?? '')
    .toLowerCase()
    .replace(/[\d*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Регулярные платежи и подписки: расходы с одинаковым описанием почти каждый месяц и похожей суммой.
 * Возвращает [{ name, categoryId, monthly (средняя сумма в месяц) }], самые крупные — первыми.
 */
export function regularPayments(transactions, today) {
  const monthStart = startOfMonth(today);
  const groups = new Map();
  for (const tx of expensesOf(inRange(transactions, addMonths(monthStart, -REGULAR_LOOKBACK_MONTHS), monthStart))) {
    const key = descriptionKey(tx.comment);
    if (!key || tx.amount >= 0) continue;
    const group = groups.get(key) ?? { name: tx.comment.trim(), categoryId: tx.categoryId, months: new Map() };
    const month = startOfMonth(txDate(tx)).getTime();
    group.months.set(month, (group.months.get(month) ?? 0) - tx.amount);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map(({ name, categoryId, months }) => ({ name, categoryId, amounts: [...months.values()] }))
    .filter(({ amounts }) => amounts.length >= REGULAR_MIN_MONTHS && Math.max(...amounts) <= Math.min(...amounts) * REGULAR_SPREAD)
    .map(({ name, categoryId, amounts }) => ({ name, categoryId, monthly: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) }))
    .sort((a, b) => b.monthly - a.monthly);
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
