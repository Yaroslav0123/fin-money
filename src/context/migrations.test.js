import { CURRENT_VERSION, migrateState } from './migrations.js';

// Сохранённые данные старых версий доходят до текущей по цепочке шагов
const V2 = {
  openingBalance: 100.5,
  transactions: [
    { id: 'a', type: 'expense', amount: -0.1, date: '2026-10-01T10:00:00.000Z' },
    { id: 'b', type: 'expense', amount: -0.2, date: '2026-10-01T11:00:00.000Z', importKey: '01.10.2026 14:00|-0.2|кафе | бар' },
  ],
  savingsTransactions: [],
  goals: [],
  categories: [],
};

describe('migrateState', () => {
  it('версия 2: рубли → целые копейки, без ошибок дробных чисел', () => {
    const data = migrateState(V2);
    expect(data.version).toBe(CURRENT_VERSION);
    expect(data.transactions.map((tx) => tx.amount)).toEqual([-10, -20]);
    // 0,1 + 0,2 в рублях — 0,30000000000000004, в копейках — ровно 30
    expect(data.transactions.reduce((sum, tx) => sum + tx.amount, 0)).toBe(-30);
    // В ключе повторов меняется только сумма, описание с «|» не ломается
    expect(data.transactions[1].importKey).toBe('01.10.2026 14:00|-20|кафе | бар');
    expect(data.accounts).toEqual([{ id: 'main', name: 'Основной счёт', openingBalance: 10050 }]);
    expect(data).not.toHaveProperty('openingBalance');
    expect(data.transactions.every((tx) => tx.accountId === 'main')).toBe(true);
  });

  it('текущая версия не меняется, повторный перенос ничего не портит', () => {
    const once = migrateState(V2);
    expect(migrateState(once)).toEqual(once);
  });
});
