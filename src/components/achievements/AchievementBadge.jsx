import { Lock } from 'lucide-react';
import IconTile from '../ui/IconTile.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { fillTemplate, toPercent } from '../../utils/format.js';

/**
 * Значок достижения: полученное — цветное, ещё нет — серое, с замком и полоской прогресса.
 * item — из buildAchievements(): { icon, accent, title, hint, current, target, unit, unlocked }.
 */
export default function AchievementBadge({ item, texts }) {
  const unit = item.unit ?? '';
  return (
    <div className={`flex items-start gap-3 rounded-2xl p-3 ${item.unlocked ? 'bg-surface' : 'bg-surface/60'}`}>
      <span className="relative">
        <IconTile icon={item.icon} accent={item.unlocked ? item.accent : 'gray'} className={item.unlocked ? '' : 'opacity-60'} />
        {!item.unlocked && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-ink-muted shadow-soft">
            <Lock className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${item.unlocked ? 'text-ink' : 'text-ink-secondary'}`}>{item.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.hint}</p>
        {item.unlocked ? (
          <p className="mt-1.5 text-xs font-semibold text-positive">{texts.unlocked}</p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={toPercent(item.current, item.target)} label={item.title} className="h-1.5" />
            <span className="shrink-0 text-[11px] font-semibold text-ink-muted">
              {fillTemplate(texts.value, { current: `${item.current}${unit}`, target: `${item.target}${unit}` })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
