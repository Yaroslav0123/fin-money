import { act, renderHook } from '@testing-library/react';
import { FinanceProvider, useFinance } from './FinanceContext.jsx';
import { GOALS, SAVINGS, SUMMARY } from '../data/mockData.js';

// Общее состояние финансов: баланс, доходы, расходы, накопления и цели
const renderFinance = () => renderHook(() => useFinance(), { wrapper: FinanceProvider });

const firstExpenseCategory = (result) => result.current.categories[0];

describe('FinanceContext', () => {
  it('начинает с данных из mockData', () => {
    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount);
    expect(result.current.savingsBalance).toBe(SAVINGS.balance);
    expect(result.current.goals).toHaveLength(GOALS.length);
  });

  it('доход увеличивает баланс и доходы', () => {
    const { result } = renderFinance();
    act(() => result.current.addTransaction({ type: 'income', amount: 1000, categoryId: 'salary', comment: '' }));
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount + 1000);
    expect(result.current.summary.income.amount).toBe(SUMMARY.income.amount + 1000);
    expect(result.current.summary.expenses.amount).toBe(SUMMARY.expenses.amount);
  });

  it('расход уменьшает баланс и попадает в свою категорию', () => {
    const { result } = renderFinance();
    const category = firstExpenseCategory(result);
    act(() => result.current.addTransaction({ type: 'expense', amount: 500, categoryId: category.id, comment: '' }));
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount - 500);
    expect(result.current.summary.expenses.amount).toBe(SUMMARY.expenses.amount + 500);
    expect(firstExpenseCategory(result).amount).toBe(category.amount + 500);
    expect(result.current.transactions[0]).toMatchObject({ type: 'expense', amount: -500 });
  });

  it('пополнение накоплений — перевод: баланс уменьшается, доходы и расходы не меняются', () => {
    const { result } = renderFinance();
    act(() => result.current.moveSavings('deposit', 2000));
    expect(result.current.savingsBalance).toBe(SAVINGS.balance + 2000);
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount - 2000);
    expect(result.current.summary.income.amount).toBe(SUMMARY.income.amount);
    expect(result.current.summary.expenses.amount).toBe(SUMMARY.expenses.amount);
    expect(result.current.transactions[0]).toMatchObject({ type: 'transfer', amount: -2000 });
  });

  it('снятие с накоплений возвращает деньги на баланс', () => {
    const { result } = renderFinance();
    act(() => result.current.moveSavings('withdraw', 3000));
    expect(result.current.savingsBalance).toBe(SAVINGS.balance - 3000);
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount + 3000);
  });

  it('пополнение цели списывается с баланса как перевод', () => {
    const { result } = renderFinance();
    const goal = result.current.goals[0];
    act(() => result.current.depositToGoal(goal, 1500));
    expect(result.current.goals[0].saved).toBe(goal.saved + 1500);
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount - 1500);
    expect(result.current.summary.expenses.amount).toBe(SUMMARY.expenses.amount);
    expect(result.current.transactions[0].title).toContain(goal.name);
  });

  it('восстанавливает данные после перезагрузки вместе с иконками', () => {
    const first = renderFinance();
    const goal = first.result.current.goals[0];
    act(() => first.result.current.moveSavings('deposit', 2000));
    act(() => first.result.current.depositToGoal(goal, 1000));
    act(() => first.result.current.setHideBalance(true));
    first.unmount();

    // «Перезагрузка»: новый провайдер читает localStorage
    const { result } = renderFinance();
    expect(result.current.savingsBalance).toBe(SAVINGS.balance + 2000);
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount - 3000);
    expect(result.current.goals[0].saved).toBe(goal.saved + 1000);
    expect(result.current.goals[0].icon).toBe(goal.icon);
    expect(result.current.hideBalance).toBe(true);
    expect(result.current.transactions[0].icon).toBeTruthy();
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

  it('сброс возвращает исходные данные и очищает сохранение', () => {
    const first = renderFinance();
    act(() => first.result.current.moveSavings('deposit', 5000));
    act(() => first.result.current.resetDemo());
    expect(first.result.current.savingsBalance).toBe(SAVINGS.balance);
    expect(first.result.current.summary.balance.amount).toBe(SUMMARY.balance.amount);
    first.unmount();

    const { result } = renderFinance();
    expect(result.current.savingsBalance).toBe(SAVINGS.balance);
  });

  it('игнорирует повреждённое сохранение', () => {
    window.localStorage.setItem('fin-money:demo:v1', '{не json');
    const { result } = renderFinance();
    expect(result.current.summary.balance.amount).toBe(SUMMARY.balance.amount);
  });

  it('новая цель добавляется с нулевым накоплением', () => {
    const { result } = renderFinance();
    act(() => result.current.createGoal({ name: 'Велосипед', target: 50000, icon: null, accent: 'green' }));
    const created = result.current.goals.at(-1);
    expect(created).toMatchObject({ name: 'Велосипед', target: 50000, saved: 0 });
    expect(result.current.goals).toHaveLength(GOALS.length + 1);
  });
});
