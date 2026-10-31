import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiggyBank, Plus, Target, Trophy } from 'lucide-react';
import KpiCard from '../components/analytics/KpiCard.jsx';
import CreateGoalDialog from '../components/goals/CreateGoalDialog.jsx';
import GoalTile from '../components/goals/GoalTile.jsx';
import GoalsDistributionCard from '../components/goals/GoalsDistributionCard.jsx';
import NewGoalTile from '../components/goals/NewGoalTile.jsx';
import AmountDialog from '../components/goals/AmountDialog.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { GOAL_ICON_OPTIONS, GOAL_TERM_OPTIONS, GOALS_PAGE } from '../data/mockData.js';
import { goalForecast, isGoalDone } from '../utils/finance.js';
import { fillTemplate, formatMoney } from '../utils/format.js';

// Сколько длится праздничная анимация достигнутой цели
const CELEBRATION_MS = 2600;

// Правила фильтрации списка целей
const FILTERS = {
  all: () => true,
  active: (goal) => !isGoalDone(goal),
  done: isGoalDone,
};

/**
 * Экран «Цели» (веб-версия).
 * Цели можно пополнять, создавать, изменять и удалять — изменения живут в общем состоянии,
 * поэтому видны на «Главной», в «Накоплениях» и на лендинге.
 * При удалении накопленное на цели возвращается на основной счёт.
 * У каждой цели — прогноз даты по темпу пополнений; пополнение, которое закрывает цель, празднуется «конфетти».
 */
export default function GoalsScreen() {
  const { goals, depositToGoal, createGoal, updateGoal, deleteGoal, accounts, rawTransactions, today } = useFinance();
  const { notify } = useAppActions();
  const [filter, setFilter] = useState('all');
  const [depositGoal, setDepositGoal] = useState(null);
  // Диалог цели: null — закрыт, { goal: null } — новая, { goal } — изменение
  const [goalDialog, setGoalDialog] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  // Цель, которую только что достигли: на её карточке — праздничная анимация
  const [celebratingId, setCelebratingId] = useState(null);
  const { kpi, tile } = GOALS_PAGE;

  // Сводные показатели
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalLeft = goals.filter(FILTERS.active).reduce((sum, g) => sum + (g.target - g.saved), 0);
  const doneCount = goals.filter(isGoalDone).length;
  const visibleGoals = goals.filter(FILTERS[filter]);

  const handleDeposit = (_mode, amount) => {
    depositToGoal(depositGoal, amount);
    if (depositGoal.saved + amount >= depositGoal.target) {
      setCelebratingId(depositGoal.id);
      notify(fillTemplate(GOALS_PAGE.reached, { name: depositGoal.name }));
    }
    setDepositGoal(null);
  };

  // Праздник короткий: через пару секунд карточка возвращается к обычному виду
  useEffect(() => {
    if (!celebratingId) return undefined;
    const timer = setTimeout(() => setCelebratingId(null), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebratingId]);

  const handleSave = (draft) => {
    if (goalDialog.goal) {
      updateGoal(goalDialog.goal.id, draft);
      notify(GOALS_PAGE.updated);
    } else {
      createGoal(draft);
      setFilter('all');
      notify(GOALS_PAGE.created);
    }
    setGoalDialog(null);
  };

  const handleDelete = () => {
    deleteGoal(deletingGoal.id);
    setDeletingGoal(null);
    notify(GOALS_PAGE.deleteDialog.done);
  };

  // Пополнить можно не больше остатка до цели и не больше денег на основном счёте
  const goalLeft = depositGoal ? depositGoal.target - depositGoal.saved : 0;
  const depositLimits = [
    { max: goalLeft, error: GOALS_PAGE.depositDialog.errorTooMuch },
    { max: accounts[0].balance, error: GOALS_PAGE.depositDialog.errorNoFunds },
  ];

  // Тексты диалога пополнения с названием выбранной цели
  const depositTexts = {
    ...GOALS_PAGE.depositDialog,
    deposit: {
      title: depositGoal ? `${GOALS_PAGE.depositDialog.titlePrefix} «${depositGoal.name}»` : '',
      confirm: GOALS_PAGE.depositDialog.confirm,
    },
  };

  const { deleteDialog } = GOALS_PAGE;
  const deleteText =
    deletingGoal?.saved > 0 ? fillTemplate(deleteDialog.refund, { amount: formatMoney(deletingGoal.saved) }) : deleteDialog.noRefund;

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Сводка */}
        <Reveal>
          <KpiCard icon={PiggyBank} accent="brand" label={kpi.saved} amount={totalSaved} footer={kpi.savedHint} />
        </Reveal>
        <Reveal delay={0.05}>
          <KpiCard icon={Target} accent="blue" label={kpi.left} amount={totalLeft} footer={kpi.leftHint} />
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
        <Reveal delay={0.1} className="flex flex-wrap items-center justify-between gap-3 xl:col-span-3">
          <SegmentedControl
            id="goals-filter"
            options={GOALS_PAGE.filters}
            value={filter}
            onChange={setFilter}
            className="bg-card shadow-soft"
          />
          <Button size="sm" pill onClick={() => setGoalDialog({ goal: null })}>
            <Plus className="h-4 w-4" />
            {GOALS_PAGE.newGoal}
          </Button>
        </Reveal>

        {/* Список целей */}
        <div className="grid content-start gap-5 sm:grid-cols-2 xl:col-span-2">
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
                <GoalTile
                  goal={goal}
                  texts={tile}
                  forecast={goalForecast(goal, rawTransactions, today)}
                  celebrate={celebratingId === goal.id}
                  onDeposit={setDepositGoal}
                  onEdit={(g) => setGoalDialog({ goal: g })}
                  onDelete={setDeletingGoal}
                />
              </motion.div>
            ))}
            <motion.div key="new-goal" layout className={goals.length === 0 ? 'sm:col-span-2' : ''}>
              <NewGoalTile
                title={goals.length === 0 ? GOALS_PAGE.empty : GOALS_PAGE.newGoal}
                hint={goals.length === 0 ? GOALS_PAGE.emptyHint : GOALS_PAGE.newGoalHint}
                onClick={() => setGoalDialog({ goal: null })}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <Reveal delay={0.15}>
          <GoalsDistributionCard goals={goals} texts={GOALS_PAGE.distribution} className="xl:sticky xl:top-28" />
        </Reveal>
      </div>

      <AmountDialog
        mode={depositGoal ? 'deposit' : null}
        hint={{ label: GOALS_PAGE.depositDialog.available, amount: goalLeft }}
        limits={depositLimits}
        texts={depositTexts}
        onClose={() => setDepositGoal(null)}
        onConfirm={handleDeposit}
      />
      {/* Для каждой цели свой экземпляр: форма сразу заполнена её значениями */}
      <CreateGoalDialog
        key={goalDialog?.goal?.id ?? 'new'}
        isOpen={Boolean(goalDialog)}
        goal={goalDialog?.goal ?? null}
        texts={GOALS_PAGE.createDialog}
        iconOptions={GOAL_ICON_OPTIONS}
        termOptions={GOAL_TERM_OPTIONS}
        onClose={() => setGoalDialog(null)}
        onSave={handleSave}
      />
      <ConfirmDialog
        isOpen={Boolean(deletingGoal)}
        title={deleteDialog.title}
        text={deletingGoal ? `«${deletingGoal.name}». ${deleteText}` : ''}
        confirmLabel={deleteDialog.confirm}
        cancelLabel={deleteDialog.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeletingGoal(null)}
      />
    </>
  );
}
