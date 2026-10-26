import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiggyBank, Plus, Target, Trophy } from 'lucide-react';
import KpiCard from '../components/analytics/KpiCard.jsx';
import CreateGoalDialog from '../components/goals/CreateGoalDialog.jsx';
import GoalTile from '../components/goals/GoalTile.jsx';
import GoalsDistributionCard from '../components/goals/GoalsDistributionCard.jsx';
import NewGoalTile from '../components/goals/NewGoalTile.jsx';
import AmountDialog from '../components/savings/AmountDialog.jsx';
import Button from '../components/ui/Button.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import { GOAL_ICON_OPTIONS, GOAL_TERM_OPTIONS, GOALS, GOALS_PAGE } from '../data/mockData.js';
import { formatMoney } from '../utils/format.js';

const isDone = (goal) => goal.saved >= goal.target;

// Правила фильтрации списка целей
const FILTERS = {
  all: () => true,
  active: (goal) => !isDone(goal),
  done: isDone,
};

/**
 * Экран «Цели» (веб-версия).
 * Можно пополнять цели и создавать новые — изменения живут
 * в состоянии экрана до перезагрузки страницы.
 */
export default function GoalsScreen() {
  const [goals, setGoals] = useState(GOALS);
  const [filter, setFilter] = useState('all');
  const [depositGoal, setDepositGoal] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const nextId = useRef(1);
  const { kpi, tile } = GOALS_PAGE;

  // Сводные показатели
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalLeft = goals.filter(FILTERS.active).reduce((sum, g) => sum + (g.target - g.saved), 0);
  const doneCount = goals.filter(isDone).length;
  const visibleGoals = goals.filter(FILTERS[filter]);

  const handleDeposit = (_mode, amount) => {
    setGoals((prev) => prev.map((g) => (g.id === depositGoal.id ? { ...g, saved: g.saved + amount } : g)));
    setDepositGoal(null);
  };

  const handleCreate = (draft) => {
    setGoals((prev) => [...prev, { ...draft, id: `new-goal-${nextId.current++}`, saved: 0 }]);
    setIsCreateOpen(false);
    setFilter('all');
  };

  // Тексты диалога пополнения с названием выбранной цели
  const depositTexts = {
    ...GOALS_PAGE.depositDialog,
    deposit: {
      title: depositGoal ? `${GOALS_PAGE.depositDialog.titlePrefix} «${depositGoal.name}»` : '',
      confirm: GOALS_PAGE.depositDialog.confirm,
    },
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Сводка */}
        <Reveal>
          <KpiCard icon={PiggyBank} accent="brand" label={kpi.saved} value={formatMoney(totalSaved)} footer={kpi.savedHint} />
        </Reveal>
        <Reveal delay={0.05}>
          <KpiCard icon={Target} accent="blue" label={kpi.left} value={formatMoney(totalLeft)} footer={kpi.leftHint} />
        </Reveal>
        <Reveal delay={0.1}>
          <KpiCard
            icon={Trophy}
            accent="orange"
            label={kpi.done}
            value={`${doneCount} ${kpi.doneOf} ${goals.length}`}
            footer={kpi.doneHint}
          />
        </Reveal>

        {/* Фильтр и кнопка создания */}
        <Reveal delay={0.1} className="flex flex-wrap items-center justify-between gap-3 lg:col-span-3">
          <SegmentedControl
            id="goals-filter"
            options={GOALS_PAGE.filters}
            value={filter}
            onChange={setFilter}
            className="bg-white shadow-soft"
          />
          <Button size="sm" pill onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {GOALS_PAGE.newGoal}
          </Button>
        </Reveal>

        {/* Список целей */}
        <div className="grid content-start gap-5 sm:grid-cols-2 lg:col-span-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleGoals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <GoalTile goal={goal} texts={tile} onDeposit={setDepositGoal} />
              </motion.div>
            ))}
            <motion.div key="new-goal" layout>
              <NewGoalTile
                title={GOALS_PAGE.newGoal}
                hint={GOALS_PAGE.newGoalHint}
                onClick={() => setIsCreateOpen(true)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <Reveal delay={0.15}>
          <GoalsDistributionCard goals={goals} texts={GOALS_PAGE.distribution} className="lg:sticky lg:top-28" />
        </Reveal>
      </div>

      <AmountDialog
        mode={depositGoal ? 'deposit' : null}
        balance={depositGoal ? depositGoal.target - depositGoal.saved : 0}
        texts={depositTexts}
        onClose={() => setDepositGoal(null)}
        onConfirm={handleDeposit}
      />
      <CreateGoalDialog
        isOpen={isCreateOpen}
        texts={GOALS_PAGE.createDialog}
        iconOptions={GOAL_ICON_OPTIONS}
        termOptions={GOAL_TERM_OPTIONS}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
