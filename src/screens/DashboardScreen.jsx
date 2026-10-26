import ExpenseStructureCard from '../components/cards/ExpenseStructureCard.jsx';
import StatCard from '../components/cards/StatCard.jsx';
import BalanceCard from '../components/dashboard/BalanceCard.jsx';
import GoalCard from '../components/dashboard/GoalCard.jsx';
import SavingsPreviewCard from '../components/dashboard/SavingsPreviewCard.jsx';
import TransactionsCard from '../components/dashboard/TransactionsCard.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { DASHBOARD, SAVINGS } from '../data/mockData.js';

/**
 * Экран 2. Главная (веб-версия).
 * Сетка: баланс + цель → доходы, расходы, накопления → структура расходов + операции.
 * Баланс, доходы, расходы, категории и операции берутся из общего состояния,
 * поэтому сразу учитывают операции, добавленные через «+», переводы на накопления
 * и пополнения целей. Настройка «Скрывать баланс» прячет сумму при открытии экрана.
 * onNavigate — переход на другие экраны (например, в «Накопления»).
 */
export default function DashboardScreen({ onNavigate }) {
  const { summary, categories, transactions, goals, savingsBalance, hideBalance } = useFinance();
  const goal = goals.find((g) => g.id === DASHBOARD.goal.goalId);
  const openSavings = () => onNavigate('savings');

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Reveal className="lg:col-span-2">
        <BalanceCard
          balance={summary.balance}
          texts={DASHBOARD}
          hiddenByDefault={hideBalance}
          onDeposit={openSavings}
        />
      </Reveal>
      <Reveal delay={0.05}>
        <GoalCard goal={goal} texts={DASHBOARD.goal} />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-3 lg:col-span-3">
        <Reveal delay={0.1}>
          <StatCard stat={summary.income} className="h-full" />
        </Reveal>
        <Reveal delay={0.15}>
          <StatCard stat={summary.expenses} className="h-full" />
        </Reveal>
        <Reveal delay={0.2}>
          <SavingsPreviewCard savings={{ ...SAVINGS, balance: savingsBalance }} texts={DASHBOARD.savingsCard} onOpen={openSavings} />
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <ExpenseStructureCard
          title={DASHBOARD.structure.title}
          caption={DASHBOARD.structure.caption}
          allLink={DASHBOARD.structure.allLink}
          categories={categories}
          total={summary.expenses.amount}
          className="h-full"
        />
      </Reveal>
      <Reveal delay={0.15} className="lg:col-span-2">
        <TransactionsCard
          transactions={transactions.slice(0, DASHBOARD.transactions.limit)}
          texts={DASHBOARD.transactions}
          className="h-full"
        />
      </Reveal>
    </div>
  );
}
