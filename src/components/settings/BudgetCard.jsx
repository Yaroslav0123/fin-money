import { motion } from 'framer-motion';
import { TriangleAlert, Wallet } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { fillTemplate, formatMoney, toPercent } from '../../utils/format.js';

const FULL = 100;

/**
 * Месячный бюджет: ползунок лимита и шкала «потрачено из лимита».
 * Ближе к лимиту шкала и подсказка становятся красными.
 * limit / onLimitChange — лимит хранится в настройках, month — название текущего месяца.
 */
export default function BudgetCard({ spent, limit, month, texts, onLimitChange, className = '' }) {
  const percent = toPercent(spent, limit);
  const isWarning = percent >= texts.warnAt;
  const left = limit - spent;

  return (
    <Card className={`flex flex-col p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-ink">{texts.title}</h3>
          <p className="text-xs text-ink-muted">{texts.description}</p>
        </div>
      </div>

      <p className="mt-6 text-3xl font-extrabold tracking-tight text-ink">{formatMoney(limit)}</p>
      <input
        type="range"
        min={texts.range.min}
        max={texts.range.max}
        step={texts.range.step}
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        aria-label={texts.title}
        aria-valuetext={formatMoney(limit)}
        className="mt-4 w-full cursor-pointer accent-brand"
      />

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-ink-muted">{fillTemplate(texts.spentLabel, { month })}</span>
          <span className="text-right font-semibold text-ink">
            {formatMoney(spent)} {texts.of} {formatMoney(limit)}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/5">
          <motion.div
            className={`h-full rounded-full ${isWarning ? 'bg-negative' : 'bg-gradient-to-r from-brand to-accent-green'}`}
            animate={{ width: `${Math.min(FULL, percent)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isWarning ? 'text-negative' : 'text-positive'}`}>
          {isWarning && <TriangleAlert className="h-3.5 w-3.5" />}
          {isWarning && left >= 0 && `${texts.warning}. `}
          {left >= 0 ? `${texts.left} ${formatMoney(left)}` : `${texts.over} ${formatMoney(-left)}`}
        </p>
      </div>
    </Card>
  );
}
