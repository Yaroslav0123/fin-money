import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { fillTemplate, plural } from '../../utils/format.js';

/**
 * Серия «в ритме»: огонёк с числом дней подряд, когда траты не выше обычного, и лучшая серия.
 * streak — из spendingStreak(); пока серии нет — подсказка, с чего она начнётся.
 */
export default function StreakMeter({ streak, texts, className = '' }) {
  const isOn = streak.current > 0;
  return (
    <div className={`flex items-center gap-4 rounded-2xl bg-gradient-to-r from-accent-orange/15 to-accent-pink/10 p-4 ${className}`}>
      <motion.span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isOn ? 'bg-accent-orange text-white' : 'bg-ink/5 text-ink-muted'}`}
        animate={isOn ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <Flame className="h-6 w-6" strokeWidth={2.4} />
      </motion.span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-muted">{texts.label}</p>
        {isOn ? (
          <p className="text-sm text-ink-secondary">
            <span className="text-2xl font-extrabold tracking-tight text-ink">{streak.current}</span>{' '}
            {plural(streak.current, texts.words)} {texts.hint}
          </p>
        ) : (
          <p className="text-sm text-ink-secondary">{texts.none}</p>
        )}
        {streak.best > 0 && (
          <p className="mt-0.5 text-xs text-ink-muted">{fillTemplate(texts.best, { count: streak.best, word: plural(streak.best, texts.words) })}</p>
        )}
      </div>
    </div>
  );
}
