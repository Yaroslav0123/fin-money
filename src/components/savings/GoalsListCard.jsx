import { Target } from 'lucide-react';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatMoney, toPercent } from '../../utils/format.js';

// Компактный список целей, на которые идут накопления
export default function GoalsListCard({ goals, texts, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <LinkArrow to="goals">{texts.allLink}</LinkArrow>
      </div>

      {goals.length === 0 && <EmptyState icon={Target} text={texts.empty} />}
      <ul className="mt-5 space-y-5">
        {goals.map((goal) => {
          const percent = Math.min(100, toPercent(goal.saved, goal.target));
          return (
            <li key={goal.id}>
              <div className="flex items-center gap-3">
                <IconTile icon={goal.icon} accent={goal.accent} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{goal.name}</p>
                  <p className="text-xs text-ink-muted">
                    {formatMoney(goal.saved)} / {formatMoney(goal.target)}
                  </p>
                </div>
                <span className="text-sm font-bold text-ink">{percent}%</span>
              </div>
              <ProgressBar value={percent} label={goal.name} className="mt-3" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
