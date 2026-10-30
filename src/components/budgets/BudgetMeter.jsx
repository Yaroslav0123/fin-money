import { motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';
import IconTile from '../ui/IconTile.jsx';
import { CATEGORY_BUDGETS } from '../../data/mockData.js';
import { fillTemplate, formatMoney } from '../../utils/format.js';

const FULL = 100;

// Цвет шкалы, подписи и значка по состоянию лимита (см. budgetProgress).
// Оранжевый на белом плохо читается, поэтому у «почти исчерпан» оранжевые только шкала и значок.
const TONES = {
  ok: { bar: 'bg-gradient-to-r from-brand to-accent-green', text: 'text-ink-muted', icon: '' },
  warning: { bar: 'bg-accent-orange', text: 'text-ink-secondary', icon: 'text-accent-orange' },
  over: { bar: 'bg-negative', text: 'text-negative', icon: '' },
};

// Подпись под шкалой: сколько осталось, почти исчерпан или превышен
export const budgetStatusText = (budget) => {
  const t = CATEGORY_BUDGETS;
  if (budget.status === 'over') return fillTemplate(t.over, { amount: formatMoney(-budget.left) });
  return fillTemplate(budget.status === 'warning' ? t.warning : t.left, { amount: formatMoney(budget.left) });
};

/**
 * Лимит одной категории: иконка, «потрачено из лимита», шкала и подпись.
 * budget — элемент budgetProgress; actions — кнопки справа (изменить, убрать), если нужны.
 */
export default function BudgetMeter({ budget, actions = null }) {
  const tone = TONES[budget.status];
  const t = CATEGORY_BUDGETS;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <IconTile icon={budget.icon} accent={budget.accent} size="sm" />
      <div className="min-w-0 flex-1">
        {/* На узком экране сумма переносится под название, а не обрезает его */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
          <span className="max-w-full truncate font-semibold text-ink">{budget.name}</span>
          <span className="shrink-0 text-xs font-semibold text-ink">
            {fillTemplate(t.spentOf, { spent: formatMoney(budget.spent), limit: formatMoney(budget.limit) })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={budget.name}
          aria-valuemin={0}
          aria-valuemax={FULL}
          aria-valuenow={Math.min(FULL, budget.percent)}
          aria-valuetext={budgetStatusText(budget)}
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink/5"
        >
          <motion.div
            className={`h-full rounded-full ${tone.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(FULL, budget.percent)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${tone.text}`}>
          {budget.status !== 'ok' && <TriangleAlert className={`h-3.5 w-3.5 shrink-0 ${tone.icon}`} />}
          {budgetStatusText(budget)}
        </p>
      </div>
      {actions}
    </div>
  );
}
