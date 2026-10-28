import { motion } from 'framer-motion';

const FULL = 100;

// Прогресс-бар, который плавно заполняется при появлении на экране.
// label — что измеряет полоса (для экранных дикторов), value — проценты.
export default function ProgressBar({ value, label, className = '' }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={FULL}
      aria-valuenow={Math.round(value)}
      className={`h-2 w-full overflow-hidden rounded-full bg-ink/5 ${className}`}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-brand to-accent-green"
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}
