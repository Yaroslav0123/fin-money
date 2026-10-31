import { motion } from 'framer-motion';

const FULL = 100;
// Отметки на кольце: четверть, половина, три четверти пути
export const MILESTONES = [25, 50, 75];
const STROKE = 10;
const VIEWBOX = 100;
const RADIUS = (VIEWBOX - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Кольцо прогресса с отметками 25/50/75%: пройденные отметки — белые точки на заливке,
 * впереди — серые. Заполняется плавно при появлении на экране. В центре — проценты.
 * label — что измеряет кольцо (для экранных дикторов), value — проценты, size — сторона в пикселях.
 */
export default function ProgressRing({ value, label, size = 96, className = '' }) {
  const percent = Math.min(FULL, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={FULL}
      aria-valuenow={Math.round(percent)}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-ink/5" />
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          className="stroke-brand"
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          whileInView={{ strokeDashoffset: CIRCUMFERENCE * (1 - percent / FULL) }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        {MILESTONES.map((mark) => {
          const angle = (mark / FULL) * 2 * Math.PI;
          return (
            <circle
              key={mark}
              cx={50 + RADIUS * Math.cos(angle)}
              cy={50 + RADIUS * Math.sin(angle)}
              r={2}
              className={percent >= mark ? 'fill-white' : 'fill-ink/20'}
            />
          );
        })}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-ink">{Math.round(percent)}%</span>
    </div>
  );
}
