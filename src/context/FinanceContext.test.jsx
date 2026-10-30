import { act, renderHook } from '@testing-library/react';
import { FinanceProvider, useFinance } from './FinanceContext.jsx';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from './financeStorage.js';
import { CURRENT_VERSION } from './migrations.js';
import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import { rub } from '../utils/money.js';

// Общее состояние финансов: история операций, накопления, цели, категории
const renderFinance = () => renderHook(() => useFinance(), { wrapper: FinanceProvider });

// Баланс демо-данных на момент генерации (см. demoData.js), в копейках, как все суммы
const DEMO_BALANCE = rub(142560);

describe('FinanceContext', () => {
  it('начинает с демо-истории от сегодняшнего дня', () => {
    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(DEMO_BALANCE);
    expect(result.current.transactions.length).toBeGreaterThan(100);
    expect(result.current.goals).toHaveLength(4);
    expect(result.current.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    // Самая свежая операция — не позже текущего момента
    expect(new Date(result.current.transactions[0].date).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('доход увеличивает баланс и доходы месяца', () => {
    const { result } = renderFinance();
    const before = result.current.summary;
    act(() => result.current.addTransaction({ type: 'income', amount: 1000, categoryId: 'salary' }));
    expect(result.current.summary.balance.amount).toBe(before.balance.amount + 1000);
    expect(result.current.summary.income.amount).toBe(before.income.amount + 1000);
    expect(result.current.summary.expenses.amount).toBe(before.expenses.amount);
  });

  it('расход уменьшает баланс и попадает в свою категорию', () => {
    const { result } = renderFinance();
    const before = result.current.summary;
    const food = () => result.current.monthCategories.find((c) => c.id === 'food')?.amount ?? 0;
    const foodBefore = food();
    act(() => result.current.addTransaction({ type: 'expense', amount: 500, categoryId: 'food', comment: 'Кофе' }));
    expect(result.current.summary.balance.amount).toBe(before.balance.amount - 500);
    expect(result.current.summary.expenses.amount).toBe(before.expenses.amount + 500);
    expect(food()).toBe(foodBefore + 500);
    expect(result.current.transactions[0]).toMatchObject({ type: 'expense', amount: -500, title: 'Кофе', category: 'Еда' });
  });

  it('операцию можно изменить и удалить', () => {
    const { result } = renderFinance();
    const balance = result.current.summary.balance.amount;
    act(() => result.current.addTransaction({ type: 'expense', amount: 500, categoryId: 'food' }));
    const id = result.current.transactions[0].id;

    act(() => result.current.updateTransaction(id, { type: 'expense', amount: 800, categoryId: 'transport', comment: 'Такси' }));
    expect(result.current.transactions.find((t) => t.id === id)).toMatchObject({ amount: -800, category: 'Транспорт' });
    expect(result.current.summary.balance.amount).toBe(balance - 800);

    act(() => result.current.deleteTransaction(id));
    expect(result.current.transactions.find((t) => t.id === id)).toBeUndefined();
    expect(result.current.summary.balance.amount).toBe(balance);
  });

  it('пополнение накоплений — перевод; удаление перевода возвращает деньги', () => {
    const { result } = renderFinance();
    const { balance, income, expenses } = result.current.summary;
    const savings = result.current.savingsBalance;

    act(() => result.current.moveSavings('deposit', 2000));
    expect(result.current.savingsBalance).toBe(savings + 2000);
    expect(result.current.summary.balance.amount).toBe(balance.amount - 2000);
    expect(result.current.summary.income.amount).toBe(income.amount);
    expect(result.current.summary.expenses.amount).toBe(expenses.amount);
    expect(result.current.transactions[0]).toMatchObject({ type: 'transfer', amount: -2000, editable: false });

    act(() => result.current.deleteTransaction(result.current.transactions[0].id));
    expect(result.current.savingsBalance).toBe(savings);
    expect(result.current.summary.balance.amount).toBe(balance.amount);
  });

  it('снятие с накоплений возвращает деньги на баланс', () => {
    const { result } = renderFinance();
    const balance = result.current.summary.balance.amount;
    const savings = result.current.savingsBalance;
    act(() => result.current.moveSavings('withdraw', 3000));
    expect(result.current.savingsBalance).toBe(savings - 3000);
    expect(result.current.summary.balance.amount).toBe(balance + 3000);
  });

  it('пополнение цели списывается с баланса, удаление перевода уменьшает цель', () => {
    const { result } = renderFinance();
    const goal = result.current.goals[0];
    const balance = result.current.summary.balance.amount;

    act(() => result.current.depositToGoal(goal, 1500));
    expect(result.current.goals[0].saved).toBe(goal.saved + 1500);
    expect(result.current.summary.balance.amount).toBe(balance - 1500);
    expect(result.current.transactions[0].title).toContain(goal.name);

    act(() => result.current.deleteTransaction(result.current.transactions[0].id));
    expect(result.current.goals[0].saved).toBe(goal.saved);
  });

  it('цель создаётся, меняется и удаляется с возвратом накопленного', () => {
    const { result } = renderFinance();
    const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    act(() => result.current.createGoal({ name: 'Велосипед', target: 50000, deadline, iconId: 'gift', accent: 'pink' }));
    const created = result.current.goals.at(-1);
    expect(created).toMatchObject({ name: 'Велосипед', target: 50000, saved: 0 });

    act(() => result.current.updateGoal(created.id, { name: 'Самокат', target: 30000, deadline, iconId: 'gift', accent: 'pink' }));
    expect(result.current.goals.at(-1)).toMatchObject({ name: 'Самокат', target: 30000 });

    const trip = result.current.goals[0];
    const balance = result.current.summary.balance.amount;
    act(() => result.current.deleteGoal(trip.id));
    expect(result.current.goals.find((g) => g.id === trip.id)).toBeUndefined();
    expect(result.current.summary.balance.amount).toBe(balance + trip.saved);
  });

  it('удалённая категория передаёт операции запасной', () => {
    const { result } = renderFinance();
    act(() => result.current.addCategory({ type: 'expense', name: 'Спорт', iconId: 'sport', accent: 'blue' }));
    const sport = result.current.categories.at(-1);
    act(() => result.current.addTransaction({ type: 'expense', amount: 700, categoryId: sport.id }));
    act(() => result.current.updateCategory(sport.id, { name: 'Фитнес' }));
    expect(result.current.transactions[0].category).toBe('Фитнес');

    act(() => result.current.deleteCategory(sport.id));
    expect(result.current.categories.find((c) => c.id === sport.id)).toBeUndefined();
    expect(result.current.transactions[0]).toMatchObject({ categoryId: 'other', category: 'Другое' });
  });

  it('импорт выписки: возврат уменьшает расходы, перевод между счетами не входит в них, импорт можно отменить', () => {
    const { result } = renderFinance();
    const before = result.current.summary;
    const date = new Date();
    const drafts = [
      { type: 'expense', amount: 1000, incoming: false, categoryId: 'food', comment: 'Магазин', date, importKey: 'a' },
      { type: 'expense', amount: 300, incoming: true, categoryId: 'food', comment: 'Возврат', date, importKey: 'b' },
      { type: 'transfer', amount: 5000, incoming: false, categoryId: null, comment: 'На вклад', date, importKey: 'c' },
      { type: 'income', amount: 2000, incoming: true, categoryId: 'other-income', comment: 'Анна', date, importKey: 'd' },
    ];
    act(() => result.current.addTransactions(drafts, { fileName: 'bank.csv' }));

    expect(result.current.summary.balance.amount).toBe(before.balance.amount - 1000 + 300 - 5000 + 2000);
    expect(result.current.summary.expenses.amount).toBe(before.expenses.amount + 700);
    expect(result.current.summary.income.amount).toBe(before.income.amount + 2000);
    // «Прочие доходы» добавились, потому что пригодились
    expect(result.current.categories.find((c) => c.id === 'other-income')).toBeDefined();
    expect(result.current.transactions.find((tx) => tx.importKey === 'c')).toMatchObject({ type: 'transfer', category: 'Переводы', title: 'На вклад' });
    expect(result.current.imports).toEqual([expect.objectContaining({ fileName: 'bank.csv', count: 4 })]);

    // Возврат при правке остаётся возвратом
    const refund = result.current.transactions.find((tx) => tx.importKey === 'b');
    act(() => result.current.updateTransaction(refund.id, { type: 'expense', amount: 400, categoryId: 'food', comment: 'Возврат' }));
    expect(result.current.transactions.find((tx) => tx.id === refund.id).amount).toBe(400);

    act(() => result.current.undoImport(result.current.imports[0].id));
    expect(result.current.imports).toHaveLength(0);
    expect(result.current.summary.balance.amount).toBe(before.balance.amount);
    expect(result.current.summary.expenses.amount).toBe(before.expenses.amount);
  });

  it('разбор «Другого» меняет категории, запоминает правила; удаление категории удаляет её правила', () => {
    const { result } = renderFinance();
    const date = new Date();
    const drafts = [
      { type: 'expense', amount: 400, incoming: false, categoryId: 'other', comment: 'APTEKA', date, importKey: 'x1' },
      { type: 'expense', amount: 600, incoming: false, categoryId: 'other', comment: 'APTEKA', date, importKey: 'x2' },
    ];
    act(() => result.current.addTransactions(drafts, { fileName: 'bank.csv', rules: [{ key: 'kofe', value: 'food', label: 'KOFE' }] }));
    const ids = result.current.transactions.filter((tx) => tx.comment === 'APTEKA').map((tx) => tx.id);
    const fun = () => result.current.monthCategories.find((c) => c.id === 'fun')?.amount ?? 0;
    const funBefore = fun();

    act(() => result.current.recategorize([{ ids, value: 'fun' }], [{ key: 'apteka', value: 'fun', label: 'APTEKA' }]));
    expect(fun()).toBe(funBefore + 1000);
    expect(result.current.categoryRules.map((r) => [r.key, r.categoryName])).toEqual([
      ['apteka', 'Развлечения'],
      ['kofe', 'Еда'],
    ]);

    act(() => result.current.deleteCategoryRule('kofe'));
    act(() => result.current.deleteCategory('fun'));
    expect(result.current.categoryRules).toEqual([]);
  });

  it('восстанавливает данные и настройки после перезагрузки', () => {
    const first = renderFinance();
    const goal = first.result.current.goals[0];
    act(() => first.result.current.moveSavings('deposit', 2000));
    act(() => first.result.current.depositToGoal(goal, 1000));
    act(() => first.result.current.setHideBalance(true));
    act(() => first.result.current.setSetting('currency', 'usd'));
    const saved = first.result.current;
    first.unmount();

    // «Перезагрузка»: новый провайдер читает localStorage
    const { result } = renderFinance();
    expect(result.current.savingsBalance).toBe(saved.savingsBalance);
    expect(result.current.summary.balance.amount).toBe(DEMO_BALANCE - 3000);
    expect(result.current.goals[0].saved).toBe(goal.saved + 1000);
    expect(result.current.goals[0].icon).toBe(goal.icon);
    expect(result.current.hideBalance).toBe(true);
    expect(result.current.settings.currency).toBe('usd');
    expect(result.current.transactions[0].icon).toBeTruthy();
    act(() => result.current.setSetting('currency', 'rub'));
  });

  it('id новых записей не повторяются после перезагрузки', () => {
    const first = renderFinance();
    act(() => first.result.current.moveSavings('deposit', 100));
    const firstId = first.result.current.transactions[0].id;
    first.unmount();

    const { result } = renderFinance();
    act(() => result.current.moveSavings('deposit', 100));
    expect(result.current.transactions[0].id).not.toBe(firstId);
  });

  it('новые демо-данные заменяют изменения, «с нуля» — очищает всё', () => {
    const { result } = renderFinance();
    act(() => result.current.moveSavings('deposit', 5000));
    act(() => result.current.resetDemo());
    expect(result.current.summary.balance.amount).toBe(DEMO_BALANCE);

    act(() => result.current.startFromScratch());
    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.goals).toHaveLength(0);
    expect(result.current.savingsBalance).toBe(0);
    expect(result.current.summary.balance.amount).toBe(0);
    expect(result.current.monthCategories).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it('счета: свой баланс у каждого, общий — их сумма; удаление счёта убирает его операции', () => {
    const { result } = renderFinance();
    const total = result.current.summary.balance.amount;
    const main = result.current.accounts[0];
    expect(result.current.accounts).toHaveLength(1);
    expect(main).toMatchObject({ isPrimary: true, balance: total });

    act(() => result.current.addAccount({ name: 'Наличные', openingBalance: rub(1500.5) }));
    const cash = result.current.accounts[1];
    expect(cash).toMatchObject({ name: 'Наличные', balance: 150050, isPrimary: false, count: 0 });
    expect(result.current.summary.balance.amount).toBe(total + 150050);

    act(() => result.current.addTransaction({ type: 'expense', amount: rub(200.25), categoryId: 'food', accountId: cash.id }));
    expect(result.current.accounts[1].balance).toBe(150050 - 20025);
    expect(result.current.accounts[0].balance).toBe(main.balance);
    expect(result.current.transactions[0]).toMatchObject({ accountId: cash.id, accountBadge: 'Наличные' });

    // Выписка — на выбранный счёт, в истории импорта виден счёт
    act(() =>
      result.current.addTransactions([{ type: 'expense', amount: 1000, incoming: false, categoryId: 'food', comment: 'Магазин', date: new Date(), importKey: 'k' }], {
        fileName: 'cash.csv',
        accountId: cash.id,
      }),
    );
    expect(result.current.accounts[1].count).toBe(2);
    expect(result.current.imports[0]).toMatchObject({ accountId: cash.id, accountBadge: 'Наличные' });

    // Переводы в накопления — всегда с основного счёта
    act(() => result.current.moveSavings('deposit', 500));
    expect(result.current.transactions[0].accountId).toBe(main.id);

    // Основной счёт не удаляется, другой — вместе с операциями и историей импорта
    act(() => result.current.deleteAccount(main.id));
    expect(result.current.accounts).toHaveLength(2);
    act(() => result.current.deleteAccount(cash.id));
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.imports).toHaveLength(0);
    expect(result.current.summary.balance.amount).toBe(total - 500);
  });

  it('данные старой версии (рубли, один счёт) переносятся без потерь', () => {
    const date = new Date().toISOString();
    const legacy = {
      openingBalance: 1000,
      savingsOpeningBalance: 200,
      transactions: [
        { id: 'tx-1', type: 'expense', categoryId: 'food', comment: 'Кофе', amount: -150, date },
        { id: 'tx-2', type: 'income', categoryId: 'salary', comment: '', amount: 5000, date, importId: 'import-1', importKey: '28.10.2026 10:00|5000|' },
      ],
      savingsTransactions: [{ id: 'saving-1', type: 'deposit', amount: 300, date }],
      goals: [{ id: 'trip', name: 'Путешествие', iconId: 'plane', accent: 'green', target: 100000, saved: 2500, deadline: date }],
      categories: DEFAULT_CATEGORIES,
      imports: [{ id: 'import-1', fileName: 'bank.csv', date, count: 1 }],
      settings: { budgetLimit: 50000, currency: 'rub' },
      onboardingDone: true,
      nextId: 5,
    };
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy));

    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(rub(1000 - 150 + 5000));
    expect(result.current.accounts).toEqual([expect.objectContaining({ id: 'main', openingBalance: rub(1000), count: 2 })]);
    expect(result.current.savingsBalance).toBe(rub(500));
    expect(result.current.goals[0]).toMatchObject({ target: rub(100000), saved: rub(2500) });
    expect(result.current.settings.budgetLimit).toBe(rub(50000));
    expect(result.current.rawTransactions[1].importKey).toBe('28.10.2026 10:00|500000|');
    expect(result.current.imports[0]).toMatchObject({ accountId: 'main', count: 1 });
    expect(result.current.onboardingDone).toBe(true);

    // Сохраняется уже в новом формате, старая копия остаётся нетронутой
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(saved.version).toBe(CURRENT_VERSION);
    expect(JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY))).toEqual(legacy);
  });

  it('игнорирует повреждённое сохранение', () => {
    window.localStorage.setItem(STORAGE_KEY, '{не json');
    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(DEMO_BALANCE);
  });
});
