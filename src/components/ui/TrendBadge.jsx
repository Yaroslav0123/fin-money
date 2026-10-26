import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatTrend } from '../../utils/format.js';

// Цвет бейджа: позитивная или негативная динамика
const TONES = {
  positive: 'bg-positive-bg text-positive',
  negative: 'bg-negative-bg text-negative',
};

const SIZES = {
  sm: { badge: 'gap-0.5 px-2 py-0.5 text-[11px]', icon: 'h-3 w-3' },
  md: { badge: 'gap-1 px-2.5 py-1 text-xs', icon: 'h-3 w-3' },
  // Масштабируется от размера шрифта родителя (для мини-превью)
  em: { badge: 'gap-[0.25em] px-[0.6em] py-[0.2em] text-[0.8em]', icon: 'h-[1em] w-[1em]' },
};

/**
 * Бейдж динамики: «↑ +12 340 ₽ за месяц» или «↑ +18%».
 * trend — объект из mockData ({ percent } или { amount, suffix }).
 * tone по умолчанию определяется знаком значения.
 */
export default function TrendBadge({ trend, tone, size = 'md', className = '' }) {
  const value = trend.percent ?? trend.amount;
  const isUp = value >= 0;
  const resolvedTone = tone ?? (isUp ? 'positive' : 'negative');
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${TONES[resolvedTone]} ${SIZES[size].badge} ${className}`}
    >
      <Icon className={SIZES[size].icon} strokeWidth={2.5} />
      {formatTrend(trend)}
    </span>
  );
}
