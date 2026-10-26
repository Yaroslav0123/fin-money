import { Plus, Trophy } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatMoney, monthlyPayment, toPercent } from '../../utils/format.js';

/**
 * Карточка одной цели: прогресс, сколько осталось и сколько откладывать в месяц.
 * Достигнутая цель подсвечивается и вместо кнопки показывает награду.
 */
export default function GoalTile({ goal, texts, onDeposit }) {
  const isDone = goal.saved >= goal.target;
  const percent = Math.min(100, toPercent(goal.saved, goal.target));
  const remaining = Math.max(0, goal.target - goal.saved);

  return (
    <Card
      className={`flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted ${
        isDone ? 'ring-2 ring-brand-soft' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={goal.icon} accent={goal.accent} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-bold leading-snug text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">{goal.deadline}</p>
        </div>
        <span className="text-lg font-bold text-ink">{percent}%</span>
      </div>

      <p className="mt-6 text-2xl font-bold tracking-tight text-ink">
        {formatMoney(goal.saved)}{' '}
        <span className="text-sm font-medium text-ink-muted">
          {texts.of} {formatMoney(goal.target)}
        </span>
      </p>
      <ProgressBar value={percent} className="mt-3 h-2.5" />

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
              <span className="font-semibold text-ink">
                {formatMoney(monthlyPayment(remaining, goal.monthsLeft))}
              </span>{' '}
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
