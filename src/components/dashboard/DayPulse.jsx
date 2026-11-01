import { motion } from 'framer-motion';
import { fillTemplate, formatMoney } from '../../utils/format.js';

// Цвет «пульса»: без трат — фирменный, меньше обычного — зелёный, больше — оранжевый
const TONES = {
  none: { dot: 'bg-brand', ring: 'bg-brand/30' },
  less: { dot: 'bg-accent-green', ring: 'bg-accent-green/30' },
  more: { dot: 'bg-accent-orange', ring: 'bg-accent-orange/30' },
  plain: { dot: 'bg-brand', ring: 'bg-brand/30' },
};

// Какое состояние показать: без трат, меньше или больше обычного дня, или просто сумма (истории ещё нет)
const moodOf = ({ spent, usual }) => {
  if (spent <= 0) return 'none';
  if (usual === null || usual <= 0) return 'plain';
  return spent <= usual ? 'less' : 'more';
};

/**
 * «Пульс дня» над карточками «Главной»: сегодняшние траты против обычного дня
 * и «бьющаяся» точка рядом. pulse — результат dayPulse(); hidden — «Скрывать баланс» (без сумм).
 */
export default function DayPulse({ pulse, texts, hidden = false, className = '' }) {
  const mood = moodOf(pulse);
  const tone = TONES[mood];
  const key = hidden && mood !== 'none' ? `${mood}Hidden` : mood;
  const text = fillTemplate(texts[key], { spent: formatMoney(pulse.spent), usual: formatMoney(pulse.usual ?? 0) });

  return (
    <p className={`inline-flex items-center gap-3 rounded-full bg-card px-4 py-2 text-sm font-medium text-ink-secondary shadow-soft ${className}`}>
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <motion.span
          className={`absolute inset-0 rounded-full ${tone.ring}`}
          animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className={`relative h-2.5 w-2.5 rounded-full ${tone.dot}`} />
      </span>
      {text}
    </p>
  );
}
