import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import IconTile from '../ui/IconTile.jsx';

// Как часто появляется следующее уведомление
const FEED_INTERVAL_MS = 3200;

/**
 * «Живые» уведомления у ноутбука на первом экране: по очереди всплывают примеры того,
 * что Fin Money замечает в выписке. items — [{ id, icon, accent, title, text }].
 * При системной настройке «уменьшить движение» показывается только первое.
 */
export default function LiveFeed({ items, className = '' }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % items.length), FEED_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [items.length, reduceMotion]);

  const item = items[index];

  return (
    <div className={`pointer-events-none absolute z-20 ${className}`} aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex w-72 items-center gap-3 rounded-2xl bg-card/95 p-3 shadow-lifted ring-1 ring-line backdrop-blur"
        >
          <IconTile icon={item.icon} accent={item.accent} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{item.title}</p>
            <p className="truncate text-xs text-ink-secondary">{item.text}</p>
          </div>
          {/* «Только что»: мигающая точка */}
          <motion.span
            className="ml-auto h-2 w-2 shrink-0 rounded-full bg-brand"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
