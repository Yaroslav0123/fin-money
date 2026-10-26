import { Target } from 'lucide-react';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatMoney, toPercent } from '../../utils/format.js';

// Карточка «Финансовая цель» с прогрессом накопления
export default function GoalCard({ goal, texts }) {
  const percent = toPercent(goal.saved, goal.target);

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <LinkArrow to="goals">{texts.allLink}</LinkArrow>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <IconTile icon={Target} accent="brand" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">{goal.deadline}</p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-end justify-between">
          <p className="text-sm font-semibold text-brand">
            {formatMoney(goal.saved)}{' '}
            <span className="font-normal text-ink-muted">
              {texts.progressOf} {formatMoney(goal.target)}
            </span>
          </p>
          <span className="text-2xl font-bold text-ink">{percent}%</span>
        </div>
        <ProgressBar value={percent} className="mt-3 h-2.5" />
      </div>
    </Card>
  );
}
