import { createDemoData } from '../data/demoData.js';
import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import { categoryBreakdown, monthSummary, periodExpenses, periodRange, savingsSeries } from './finance.js';

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
});

describe('demo data', () => {
  it('одинаковая история для одной даты и баланс ровно 142 560', () => {
    const a = createDemoData(TODAY);
    const b = createDemoData(TODAY);
    expect(a.transactions).toEqual(b.transactions);
    const balance = a.openingBalance + a.transactions.reduce((s, tx) => s + tx.amount, 0);
    expect(balance).toBe(142560);
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
