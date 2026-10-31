import { createDemoData } from '../data/demoData.js';
import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import {
  averageMonthlySpend,
  budgetProgress,
  categoryBreakdown,
  categoryComparison,
  categoryHistory,
  categoryGrowth,
  goalForecast,
  goalSpeedup,
  monthForecast,
  regularPayments,
  historyRange,
  isInHistoryRange,
  monthSummary,
  notificationData,
  periodExpenses,
  periodRange,
  reconcileAccount,
  spendingCalendar,
} from './finance.js';
import { rub } from './money.js';

// Фиксированное «сегодня»: среда, 28 октября 2026, 15:30
const TODAY = new Date(2026, 9, 28, 15, 30);

const expense = (amount, date, categoryId = 'food') => ({ id: `e-${date}-${amount}`, type: 'expense', categoryId, amount: -amount, date: date.toISOString() });
const income = (amount, date) => ({ id: `i-${date}-${amount}`, type: 'income', categoryId: 'salary', amount, date: date.toISOString() });

describe('periodRange', () => {
  it('месяц — все дни текущего месяца', () => {
    const range = periodRange('month', TODAY);
    expect(range.start).toEqual(new Date(2026, 9, 1));
    expect(range.end).toEqual(new Date(2026, 10, 1));
    expect(range.buckets).toHaveLength(31);
  });

  it('неделя начинается с понедельника или воскресенья', () => {
    expect(periodRange('week', TODAY, 0, 'mon').start).toEqual(new Date(2026, 9, 26));
    expect(periodRange('week', TODAY, 0, 'sun').start).toEqual(new Date(2026, 9, 25));
  });

  it('сдвиг назад даёт предыдущий период', () => {
    expect(periodRange('month', TODAY, -1).start).toEqual(new Date(2026, 8, 1));
    expect(periodRange('day', TODAY, -1).start).toEqual(new Date(2026, 9, 27));
  });

  it('год — 12 месяцев, заканчивая текущим', () => {
    const range = periodRange('year', TODAY);
    expect(range.start).toEqual(new Date(2025, 10, 1));
    expect(range.buckets).toHaveLength(12);
    expect(range.buckets.at(-1).label).toBe('Окт');
  });
});

describe('periodExpenses', () => {
  const transactions = [
    expense(1000, new Date(2026, 9, 28, 10)),
    expense(500, new Date(2026, 9, 2, 12)),
    expense(2000, new Date(2026, 8, 3, 12)),
    income(50000, new Date(2026, 9, 5, 10)),
  ];

  it('итог — сумма столбцов, доходы не считаются расходами', () => {
    const period = periodExpenses(transactions, 'month', TODAY);
    expect(period.total).toBe(1500);
    expect(period.bars.reduce((s, b) => s + b.value, 0)).toBe(1500);
    expect(period.highlightIndex).toBe(27);
  });

  it('динамика — к тому же отрезку прошлого месяца', () => {
    // 1–28 сентября: 2000 → в октябре 1500, это −25%
    expect(periodExpenses(transactions, 'month', TODAY).trend.percent).toBe(-25);
  });
});

describe('categoryBreakdown', () => {
  it('только категории с тратами, от крупной к мелкой, доли в процентах', () => {
    const items = [expense(300, TODAY, 'food'), expense(700, TODAY, 'transport')];
    const result = categoryBreakdown(items, DEFAULT_CATEGORIES);
    expect(result.map((c) => c.id)).toEqual(['transport', 'food']);
    expect(result.map((c) => c.share)).toEqual([70, 30]);
  });
});

describe('monthSummary', () => {
  it('баланс — начальный остаток плюс все операции', () => {
    const summary = monthSummary([income(1000, TODAY), expense(400, TODAY)], 500, TODAY);
    expect(summary).toMatchObject({ balance: 1100, income: 1000, expenses: 400, monthChange: 600 });
  });

  it('«те же дни прошлого месяца» не заходят в текущий', () => {
    // 31 октября: в сентябре 30 дней, трата 1 октября не должна попасть в «прошлый месяц»
    const lastDay = new Date(2026, 9, 31, 20, 0);
    const items = [expense(1000, new Date(2026, 8, 15)), expense(500, new Date(2026, 9, 1, 10, 0)), expense(1500, new Date(2026, 9, 20))];
    expect(monthSummary(items, 0, lastDay)).toMatchObject({ expenses: 2000, expensesTrend: 100 });
    expect(periodExpenses(items, 'month', lastDay).trend.percent).toBe(100);
  });
});

describe('budgetProgress', () => {
  const month = [expense(rub(900), new Date(2026, 9, 3)), expense(rub(300), new Date(2026, 9, 5), 'fun'), expense(rub(50), new Date(2026, 9, 6), 'transport')];
  // Возврат покупки (расход с плюсом) уменьшает потраченное
  const refund = { ...expense(rub(100), new Date(2026, 9, 7), 'fun'), amount: rub(100) };
  const limits = { food: rub(1000), fun: rub(150), transport: rub(500) };

  it('считает потраченное из лимита и состояние, сначала самые «горячие»', () => {
    const result = budgetProgress([...month, refund], DEFAULT_CATEGORIES, limits, 80);
    expect(result.map((b) => [b.id, b.spent, b.status])).toEqual([
      ['fun', rub(200), 'over'],
      ['food', rub(900), 'warning'],
      ['transport', rub(50), 'ok'],
    ]);
    expect(result[0].left).toBe(rub(-50));
  });

  it('категории без лимита не попадают, лимиты категорий — в уведомления', () => {
    const result = budgetProgress(month, DEFAULT_CATEGORIES, { food: rub(1000) }, 80);
    expect(result).toHaveLength(1);
    const items = notificationData({ transactions: [], goals: [], monthSpent: 0, budgetLimit: rub(1), warnAt: 90, categoryBudgets: result, largeAmount: rub(5000), today: TODAY });
    expect(items).toEqual([expect.objectContaining({ id: 'budget-food', kind: 'categoryBudget' })]);
  });

  it('средние траты — по полным месяцам до текущего', () => {
    const items = [expense(rub(3000), new Date(2026, 6, 10)), expense(rub(6000), new Date(2026, 8, 10)), expense(rub(9999), new Date(2026, 9, 1))];
    expect(averageMonthlySpend(items, 'food', TODAY)).toBe(rub(3000));
    expect(averageMonthlySpend(items, 'fun', TODAY)).toBe(0);
  });
});

describe('reconcileAccount', () => {
  const account = { id: 'card', openingBalance: rub(1000) };
  const onCard = (tx) => ({ ...tx, accountId: 'card' });
  const coffee = (id, date) => onCard({ ...expense(rub(150.5), date), id, comment: 'Кофейня' });
  const transactions = [
    onCard(income(rub(5000), new Date(2026, 9, 20, 10))),
    coffee('c1', new Date(2026, 9, 21, 9)),
    coffee('c2', new Date(2026, 9, 21, 18)),
    // Позже даты сверки и на другом счёте — не учитываются
    onCard(expense(rub(700), new Date(2026, 9, 25))),
    { ...expense(rub(999), new Date(2026, 9, 21)), accountId: 'main' },
  ];
  const date = new Date(2026, 9, 22);

  it('совпадает до копейки', () => {
    const result = reconcileAccount({ account, transactions, date, bankBalance: rub(1000 + 5000 - 301) });
    expect(result).toMatchObject({ appBalance: rub(5699), difference: 0, matches: true, laterCount: 1 });
  });

  it('повтор в Fin Money: разница — минус его сумма, операция в подозреваемых', () => {
    const result = reconcileAccount({ account, transactions, date, bankBalance: rub(1000 + 5000 - 150.5) });
    expect(result.difference).toBe(rub(150.5));
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].map((tx) => tx.id)).toEqual(['c1', 'c2']);
    expect(result.suspects.map((tx) => tx.id)).toEqual(['c1', 'c2']);
    expect(result.lastDate).toEqual(new Date(2026, 9, 21, 18));
  });

  it('пропущенная трата: в банке меньше, подозреваемых нет', () => {
    const result = reconcileAccount({ account, transactions, date, bankBalance: rub(5699 - 2000) });
    expect(result).toMatchObject({ difference: rub(-2000), matches: false, suspects: [] });
  });
});

describe('demo data', () => {
  it('одинаковая история для одной даты и баланс ровно 142 560', () => {
    const a = createDemoData(TODAY);
    const b = createDemoData(TODAY);
    expect(a.transactions).toEqual(b.transactions);
    const balance = a.accounts[0].openingBalance + a.transactions.reduce((s, tx) => s + tx.amount, 0);
    expect(balance).toBe(rub(142560));
    expect(a.transactions.every((tx) => Number.isInteger(tx.amount) && tx.accountId === a.accounts[0].id)).toBe(true);
    expect(a.transactions.every((tx) => new Date(tx.date) <= TODAY)).toBe(true);
  });
});

describe('historyRange', () => {
  it('«Этот месяц», «Прошлый месяц» и «3 месяца» — по календарным месяцам', () => {
    expect(historyRange('month', TODAY)).toEqual({ start: new Date(2026, 9, 1), end: new Date(2026, 10, 1) });
    expect(historyRange('prev', TODAY)).toEqual({ start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) });
    expect(historyRange('quarter', TODAY).start).toEqual(new Date(2026, 7, 1));
    expect(historyRange('all', TODAY)).toBeNull();
  });

  it('свой период включает последний день, пустая граница — без ограничения', () => {
    const range = historyRange('custom', TODAY, { from: '2026-10-10', to: '2026-10-12' });
    expect(isInHistoryRange(expense(1, new Date(2026, 9, 12, 23, 59)), range)).toBe(true);
    expect(isInHistoryRange(expense(1, new Date(2026, 9, 13, 0, 1)), range)).toBe(false);
    expect(isInHistoryRange(expense(1, new Date(2026, 9, 9)), range)).toBe(false);
    const openEnd = historyRange('custom', TODAY, { from: '2026-10-10', to: '' });
    expect(isInHistoryRange(expense(1, new Date(2030, 0, 1)), openEnd)).toBe(true);
  });
});

describe('spendingCalendar', () => {
  it('недели с понедельника, ступени от самого дорогого дня, будущие дни отмечены', () => {
    // Октябрь 2026 начинается в четверг: три пустые клетки перед 1-м числом
    const items = [expense(rub(1000), new Date(2026, 9, 5, 12)), expense(rub(250), new Date(2026, 9, 6, 12)), income(rub(5000), new Date(2026, 9, 6))];
    const calendar = spendingCalendar(items, new Date(2026, 9, 1), TODAY, 'mon');
    expect(calendar.weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(calendar.weeks.every((week) => week.length === 7)).toBe(true);
    const days = calendar.weeks.flat().filter(Boolean);
    expect(days).toHaveLength(31);
    expect(days[4]).toMatchObject({ amount: rub(1000), level: 4 });
    expect(days[5]).toMatchObject({ amount: rub(250), level: 1 });
    expect(days[29].isFuture).toBe(true);
    expect(calendar).toMatchObject({ max: rub(1000), total: rub(1250), activeDays: 2 });
  });
});

describe('categoryComparison', () => {
  it('сравнивает с теми же днями прошлого месяца, рост «с нуля» — без процента', () => {
    const items = [
      expense(rub(2000), new Date(2026, 9, 10), 'food'),
      expense(rub(1000), new Date(2026, 8, 10), 'food'),
      // 30 сентября — позже «тех же дней» (до 28-го), в сравнение не попадает
      expense(rub(9000), new Date(2026, 8, 30), 'food'),
      expense(rub(500), new Date(2026, 9, 3), 'transport'),
    ];
    const result = categoryComparison(items, DEFAULT_CATEGORIES, 'month', TODAY);
    expect(result.map((c) => c.id)).toEqual(['food', 'transport']);
    expect(result[0]).toMatchObject({ amount: rub(2000), previous: rub(1000), diff: rub(1000), percent: 100 });
    expect(result[1]).toMatchObject({ amount: rub(500), previous: 0, percent: null });
  });
});

describe('categoryHistory', () => {
  it('траты категории по месяцам и среднее по полным месяцам с начала истории', () => {
    const items = [expense(rub(3000), new Date(2026, 8, 5), 'food'), expense(rub(1000), new Date(2026, 9, 5), 'food'), expense(rub(700), new Date(2026, 7, 5), 'transport')];
    const { bars, average } = categoryHistory(items, 'food', TODAY, 4);
    expect(bars.map((bar) => bar.value)).toEqual([0, 0, rub(3000), rub(1000)]);
    // Июль — до первой операции, в среднее не входит; август (0) и сентябрь (3 000) — входят
    expect(average).toBe(rub(1500));
  });
});

describe('goalForecast', () => {
  const put = (amount, date) => ({ id: `c-${date}`, amount, date: date.toISOString() });
  const goal = {
    id: 'g1',
    target: rub(100000),
    saved: rub(40000),
    deadline: new Date(2027, 11, 1).toISOString(),
    contributions: [put(rub(10000), new Date(2026, 7, 30)), put(rub(10000), new Date(2026, 8, 30)), put(rub(10000), new Date(2026, 9, 20))],
  };

  it('по темпу за 3 месяца: 30 000 ₽ за 3 месяца → 10 000 ₽ в месяц, осталось 6 месяцев', () => {
    const forecast = goalForecast(goal, TODAY);
    expect(forecast).toMatchObject({ status: 'forecast', pace: rub(10000), onTime: true });
    expect(forecast.date).toEqual(new Date(2027, 3, 1));
  });

  it('без пополнений — прогноза нет; достигнутая цель — «done»', () => {
    expect(goalForecast({ ...goal, contributions: [] }, TODAY).status).toBe('noPace');
    expect(goalForecast({ ...goal, saved: goal.target }, TODAY).status).toBe('done');
  });

  it('если откладывать больше, цель ближе: 60 000 ₽ при 10 000 → 6 мес., при 15 000 → 4 мес.', () => {
    expect(goalSpeedup(goal, rub(10000), rub(5000))).toBe(2);
    expect(goalSpeedup(goal, 0, rub(5000))).toBeNull();
  });
});

describe('monthForecast', () => {
  // 15 октября: за июль–сентябрь (92 дня) на еду ушло 92 000 ₽ — обычный темп 1 000 ₽ в день
  const MID = new Date(2026, 9, 15, 12);
  const history = [6, 7, 8].flatMap((month) => [
    expense(rub(month === 8 ? 30000 : 31000), new Date(2026, month, 10), 'food'),
    { id: `s-${month}`, type: 'income', categoryId: 'salary', amount: rub(80000), date: new Date(2026, month, 5).toISOString() },
  ]);

  it('остаток месяца — по обычному темпу, доход — не меньше обычного', () => {
    const items = [...history, expense(rub(20000), new Date(2026, 9, 3), 'food')];
    const forecast = monthForecast(items, MID);
    // 16 оставшихся дней × 1 000 ₽ + уже потрачено 20 000 ₽
    expect(forecast.projectedExpenses).toBe(rub(36000));
    expect(forecast.usualExpenses).toBe(rub(30667));
    // Зарплата в октябре ещё не пришла — берём обычную
    expect(forecast.income).toBe(rub(80000));
    expect(forecast.projectedLeft).toBe(rub(44000));
    expect(forecast.endDate).toEqual(new Date(2026, 9, 31));
  });

  it('лимит, который будет превышен, — с примерной датой', () => {
    const items = [...history, expense(rub(20000), new Date(2026, 9, 3), 'food')];
    const { budgets } = monthForecast(items, MID, { food: rub(25000) });
    // До лимита 5 000 ₽ — при 1 000 ₽ в день это 5 дней
    expect(budgets).toEqual([{ categoryId: 'food', limit: rub(25000), projected: rub(36000), date: new Date(2026, 9, 20) }]);
    expect(monthForecast(items, MID, { food: rub(40000) }).budgets).toEqual([]);
  });

  it('без истории — по темпу этого месяца', () => {
    const forecast = monthForecast([expense(rub(15000), new Date(2026, 9, 2), 'food')], MID);
    expect(forecast.hasHistory).toBe(false);
    expect(forecast.projectedExpenses).toBe(rub(31000));
  });

  it('рост категории против обычного уровня', () => {
    const items = [...history, expense(rub(30000), new Date(2026, 9, 3), 'food')];
    const growth = categoryGrowth(monthForecast(items, MID), [{ id: 'food', name: 'Еда' }]);
    expect(growth).toMatchObject({ category: { name: 'Еда' }, projected: rub(46000), usual: rub(30667), percent: 50 });
  });
});

describe('regularPayments', () => {
  const pay = (comment, amount, date) => ({ id: `${comment}-${date}`, type: 'expense', categoryId: 'housing', comment, amount: -amount, date: date.toISOString() });

  it('одно описание почти каждый месяц и похожая сумма — регулярный платёж', () => {
    const items = [
      ...[6, 7, 8].map((m) => pay('Интернет 7701', rub(990), new Date(2026, m, 15))),
      ...[6, 7, 8, 9].map((m) => pay('Коммунальные услуги', rub(5000 + m * 50), new Date(2026, m, 28))),
      // Суммы слишком разные — это не подписка
      ...[6, 7, 8].map((m) => pay('Супермаркет', rub(500 * (m - 5) ** 2), new Date(2026, m, 3))),
    ];
    const regular = regularPayments(items, TODAY);
    expect(regular.map((r) => r.name)).toEqual(['Коммунальные услуги', 'Интернет 7701']);
    expect(regular[1].monthly).toBe(rub(990));
  });
});
