import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import ProgressRing, { MILESTONES } from '../ui/ProgressRing.jsx';
import { monthName } from '../../utils/dates.js';
import { fillTemplate, formatMoney, monthlyPayment, toPercent } from '../../utils/format.js';

// Разлёт «конфетти» при достижении цели: точки разных цветов во все стороны
const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * 2 * Math.PI;
  const distance = 70 + (i % 3) * 22;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, color: ['bg-brand', 'bg-accent-orange', 'bg-accent-pink', 'bg-accent-blue'][i % 4] };
});

function Celebration({ text }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {BURST.map((dot, i) => (
        <motion.span
          key={i}
          className={`absolute h-2.5 w-2.5 rounded-full ${dot.color}`}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: dot.x, y: dot.y, scale: [0, 1.2, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        className="rounded-full bg-brand-fill px-4 py-2 text-sm font-bold text-white shadow-lifted"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}

// Строка прогноза: когда цель будет достигнута при нынешнем темпе пополнений
function ForecastLine({ forecast, texts }) {
  if (!forecast || forecast.status === 'done') return null;
  if (forecast.status === 'noPace') {
    return (
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0" />
        {texts.noPace}
      </p>
    );
  }
  const date = `${monthName(forecast.date)} ${forecast.date.getFullYear()}`;
  const text = fillTemplate(forecast.onTime ? texts.forecast : texts.forecastLate, { date, pace: formatMoney(forecast.pace) });
  return (
    <p className={`mt-4 flex items-start gap-2 text-xs font-medium leading-relaxed ${forecast.onTime ? 'text-positive' : 'text-negative'}`}>
      <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  );
}

/**
 * Карточка одной цели: кольцо прогресса с отметками 25/50/75%, сколько до следующей отметки,
 * прогноз даты по темпу пополнений и сколько откладывать в месяц, чтобы успеть к сроку.
 * Достигнутая цель подсвечивается и вместо кнопки показывает награду;
 * celebrate — только что достигнута: разлетаются «конфетти».
 * Справа сверху — изменение и удаление (onEdit, onDelete).
 */
export default function GoalTile({ goal, texts, forecast, celebrate = false, onDeposit, onEdit, onDelete }) {
  const isDone = goal.saved >= goal.target;
  const percent = Math.min(100, toPercent(goal.saved, goal.target));
  const remaining = Math.max(0, goal.target - goal.saved);
  // Следующая отметка и сколько до неё осталось
  const nextMark = MILESTONES.find((mark) => percent < mark);
  const toNextMark = nextMark ? Math.max(0, Math.ceil((goal.target * nextMark) / 100) - goal.saved) : 0;
  const iconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

  return (
    <Card
      className={`group relative flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted ${
        isDone ? 'ring-2 ring-brand-soft' : ''
      }`}
    >
      <AnimatePresence>{celebrate && <Celebration text={texts.reached} />}</AnimatePresence>

      <div className="flex items-start gap-3">
        <IconTile icon={goal.icon} accent={goal.accent} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-bold leading-snug text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">{goal.deadlineLabel}</p>
        </div>
        <div className="-mr-2 -mt-1 flex shrink-0">
          <button type="button" aria-label={`${texts.edit} «${goal.name}»`} onClick={() => onEdit(goal)} className={iconButtonClass}>
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`${texts.delete} «${goal.name}»`}
            onClick={() => onDelete(goal)}
            className={`${iconButtonClass} hover:bg-negative-bg hover:text-negative`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <ProgressRing value={percent} label={goal.name} />
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-ink">{formatMoney(goal.saved)}</p>
          <p className="text-sm text-ink-muted">
            {texts.of} {formatMoney(goal.target)}
          </p>
          {nextMark && !isDone && (
            <p className="mt-2 text-xs text-ink-secondary">{fillTemplate(texts.nextMark, { mark: nextMark, amount: formatMoney(toNextMark) })}</p>
          )}
        </div>
      </div>

      <ForecastLine forecast={forecast} texts={texts} />

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        {isDone ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-brand">
            <Trophy className="h-4 w-4" />
            {texts.done}
          </span>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-ink-muted">
              {texts.left} {formatMoney(remaining)}
              <br />
              <span className="font-semibold text-ink">{formatMoney(monthlyPayment(remaining, goal.monthsLeft))}</span>{' '}
              {texts.perMonth}
            </p>
            <Button size="sm" variant="secondary" pill onClick={() => onDeposit(goal)}>
              <Plus className="h-4 w-4" />
              {texts.deposit}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
