import { createDemoData } from '../data/demoData.js';
import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import {
  averageMonthlySpend,
  budgetProgress,
  categoryBreakdown,
  monthSummary,
  notificationData,
  periodExpenses,
  periodRange,
  reconcileAccount,
  savingsSeries,
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

  it('график накоплений заканчивается текущим балансом', () => {
    const data = createDemoData(TODAY);
    const balance = data.savingsOpeningBalance + data.savingsTransactions.reduce((s, tx) => s + tx.amount, 0);
    const series = savingsSeries(data.savingsTransactions, data.savingsOpeningBalance, 'year', TODAY);
    expect(series).toHaveLength(12);
    expect(series.at(-1).value).toBe(balance);
  });
});
