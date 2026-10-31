import ExpenseStructureCard from '../components/cards/ExpenseStructureCard.jsx';
import StatCard from '../components/cards/StatCard.jsx';
import BalanceCard from '../components/dashboard/BalanceCard.jsx';
import BudgetsCard from '../components/dashboard/BudgetsCard.jsx';
import GoalCard from '../components/dashboard/GoalCard.jsx';
import StatementCard from '../components/dashboard/StatementCard.jsx';
import TransactionsCard from '../components/dashboard/TransactionsCard.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { DASHBOARD } from '../data/mockData.js';
import { monthName } from '../utils/dates.js';
import { isGoalDone } from '../utils/finance.js';
import { fillTemplate } from '../utils/format.js';

// Цель для карточки на «Главной»: ближайшая по сроку из незавершённых, иначе любая
const featuredGoal = (goals) =>
  [...goals].filter((g) => !isGoalDone(g)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] ?? goals[0] ?? null;

// «Осталось за месяц»: доходы месяца минус расходы и подпись — какая это доля доходов
const monthLeftStat = (summary) => {
  const t = DASHBOARD.monthLeft;
  const income = summary.income.amount;
  const left = income - summary.expenses.amount;
  const caption = income <= 0 ? t.noIncome : left < 0 ? t.overspent : fillTemplate(t.share, { percent: Math.round((left / income) * 100) });
  return { label: t.label, icon: t.icon, accent: t.accent, amount: left, caption };
};

/**
 * Экран 2. Главная (веб-версия).
 * Сетка: приглашение загрузить выписку (пока ни одной не загружали) → баланс + цель → доходы, расходы, остаток месяца →
 * самые заполненные лимиты категорий → структура расходов + операции. На телефоне три показателя листаются вбок,
 * чтобы не занимать три экрана подряд.
 * Всё считается из истории операций за текущий месяц, поэтому сразу учитывает
 * новые, изменённые и удалённые операции и пополнения целей.
 * Под балансом — «Загрузить выписку» и «Добавить операцию». Настройка «Скрывать баланс» прячет сумму при открытии.
 * onNavigate — переход на другие экраны (например, в «Цели»).
 */
export default function DashboardScreen({ onNavigate }) {
  const { summary, accounts, monthCategories, budgets, transactions, goals, imports, hideBalance, today } = useFinance();
  const { openTransaction, openAddTransaction, openImport } = useAppActions();
  const goal = featuredGoal(goals);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {imports.length === 0 && (
        <Reveal className="xl:col-span-3">
          <StatementCard texts={DASHBOARD.statement} />
        </Reveal>
      )}
      <Reveal className="xl:col-span-2">
        <BalanceCard
          balance={summary.balance}
          accounts={accounts}
          texts={DASHBOARD}
          hiddenByDefault={hideBalance}
          onImport={() => openImport()}
          onAdd={openAddTransaction}
        />
      </Reveal>
      <Reveal delay={0.05}>
        <GoalCard goal={goal} texts={DASHBOARD.goal} onCreate={() => onNavigate('goals')} />
      </Reveal>

      {/* На телефоне — лента карточек во всю ширину экрана, начиная с края отступа */}
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 xl:col-span-3">
        <Reveal delay={0.1} className="w-[72%] shrink-0 snap-start sm:w-auto">
          <StatCard stat={summary.income} className="h-full" />
        </Reveal>
        <Reveal delay={0.15} className="w-[72%] shrink-0 snap-start sm:w-auto">
          <StatCard stat={summary.expenses} className="h-full" />
        </Reveal>
        <Reveal delay={0.2} className="w-[72%] shrink-0 snap-start sm:w-auto">
          <StatCard stat={monthLeftStat(summary)} className="h-full" />
        </Reveal>
      </div>

      <Reveal delay={0.1} className="xl:col-span-3">
        <BudgetsCard
          budgets={budgets}
          month={monthName(today)}
          texts={DASHBOARD.budgets}
          onSetup={() => onNavigate('settings', { section: 'money' })}
        />
      </Reveal>

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
    </div>
  );
}
