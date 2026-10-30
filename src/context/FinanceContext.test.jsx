import { act, renderHook } from '@testing-library/react';
import { FinanceProvider, useFinance } from './FinanceContext.jsx';
import { STORAGE_KEY } from './financeStorage.js';
import { DEFAULT_CATEGORIES } from '../data/mockData.js';

// Общее состояние финансов: история операций, накопления, цели, категории
const renderFinance = () => renderHook(() => useFinance(), { wrapper: FinanceProvider });

// Баланс демо-данных на момент генерации (см. demoData.js)
const DEMO_BALANCE = 142560;

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

  it('игнорирует повреждённое сохранение', () => {
    window.localStorage.setItem(STORAGE_KEY, '{не json');
    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(DEMO_BALANCE);
  });
});
