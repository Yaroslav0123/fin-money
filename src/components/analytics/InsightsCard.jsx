import { Sparkles } from 'lucide-react';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';

// Карточка «Подсказки»: короткие выводы по тратам. emptyText — когда данных для выводов мало.
export default function InsightsCard({ insights, title, emptyText, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <h3 className="text-base font-bold text-ink">{title}</h3>
      </div>
      {insights.length === 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-3">
              <IconTile icon={insight.icon} accent={insight.accent} size="sm" />
              <p className="pt-1 text-sm leading-relaxed text-ink-secondary">{insight.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
