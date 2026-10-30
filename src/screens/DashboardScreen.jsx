import { useState } from 'react';
import ExpenseStructureCard from '../components/cards/ExpenseStructureCard.jsx';
import StatCard from '../components/cards/StatCard.jsx';
import BalanceCard from '../components/dashboard/BalanceCard.jsx';
import BudgetsCard from '../components/dashboard/BudgetsCard.jsx';
import GoalCard from '../components/dashboard/GoalCard.jsx';
import SavingsPreviewCard from '../components/dashboard/SavingsPreviewCard.jsx';
import TransactionsCard from '../components/dashboard/TransactionsCard.jsx';
import AmountDialog from '../components/savings/AmountDialog.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { DASHBOARD, SAVINGS_PAGE } from '../data/mockData.js';
import { monthName } from '../utils/dates.js';
import { isGoalDone } from '../utils/finance.js';

// Цель для карточки на «Главной»: ближайшая по сроку из незавершённых, иначе любая
const featuredGoal = (goals) =>
  [...goals].filter((g) => !isGoalDone(g)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] ?? goals[0] ?? null;

/**
 * Экран 2. Главная (веб-версия).
 * Сетка: баланс + цель → доходы, расходы, накопления → структура расходов + операции → лимиты категорий.
 * Всё считается из истории операций за текущий месяц, поэтому сразу учитывает
 * новые, изменённые и удалённые операции, переводы на накопления и пополнения целей.
 * «Перевести» — перевод на накопительный счёт. Настройка «Скрывать баланс» прячет сумму при открытии.
 * onNavigate — переход на другие экраны (например, в «Накопления»).
 */
export default function DashboardScreen({ onNavigate }) {
  const { summary, accounts, monthCategories, budgets, transactions, goals, savings, hideBalance, moveSavings, today } = useFinance();
  // Переводы в накопления идут с основного счёта
  const mainBalance = accounts[0].balance;
  const { openTransaction, openAddTransaction, notify } = useAppActions();
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const openSavings = () => onNavigate('savings');

  const goal = featuredGoal(goals);
  const { dialog } = SAVINGS_PAGE;
  const transferTexts = { ...dialog, deposit: DASHBOARD.transferDialog };

  const handleTransfer = (mode, amount) => {
    moveSavings(mode, amount);
    setIsTransferOpen(false);
    notify(DASHBOARD.transferDialog.done);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Reveal className="xl:col-span-2">
          <BalanceCard
            balance={summary.balance}
            accounts={accounts}
            texts={DASHBOARD}
            hiddenByDefault={hideBalance}
            onDeposit={openSavings}
            onTransfer={() => setIsTransferOpen(true)}
          />
        </Reveal>
        <Reveal delay={0.05}>
          <GoalCard goal={goal} texts={DASHBOARD.goal} onCreate={() => onNavigate('goals')} />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-3 xl:col-span-3">
          <Reveal delay={0.1}>
            <StatCard stat={summary.income} className="h-full" />
          </Reveal>
          <Reveal delay={0.15}>
            <StatCard stat={summary.expenses} className="h-full" />
          </Reveal>
          <Reveal delay={0.2}>
            <SavingsPreviewCard
              savings={{ balance: savings.balance, trend: { amount: savings.monthChange, suffix: SAVINGS_PAGE.trendSuffix } }}
              texts={DASHBOARD.savingsCard}
              onOpen={openSavings}
            />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ExpenseStructureCard
            title={DASHBOARD.structure.title}
            caption={DASHBOARD.structure.caption}
            allLink={DASHBOARD.structure.allLink}
            emptyText={DASHBOARD.structure.empty}
            categories={monthCategories}
            total={summary.expenses.amount}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.15} className="xl:col-span-2">
          <TransactionsCard
            transactions={transactions.slice(0, DASHBOARD.transactions.limit)}
            texts={DASHBOARD.transactions}
            onSelect={openTransaction}
            onAdd={openAddTransaction}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.1} className="xl:col-span-3">
          <BudgetsCard budgets={budgets} month={monthName(today)} texts={DASHBOARD.budgets} onSetup={() => onNavigate('settings')} />
        </Reveal>
      </div>

      <AmountDialog
        mode={isTransferOpen ? 'deposit' : null}
        hint={{ label: dialog.availableMain, amount: mainBalance }}
        limits={[{ max: mainBalance, error: dialog.errorNoFunds }]}
        texts={transferTexts}
        onClose={() => setIsTransferOpen(false)}
        onConfirm={handleTransfer}
      />
    </>
  );
}
