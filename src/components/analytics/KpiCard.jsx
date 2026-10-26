import { AnimatePresence, motion } from 'framer-motion';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';

/**
 * Карточка ключевого показателя. value плавно сменяется
 * при переключении периода. footer — бейдж или подпись снизу.
 */
export default function KpiCard({ icon, accent, label, value, footer }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} accent={accent} size="sm" />
        <p className="text-xs font-medium text-ink-muted">{label}</p>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mt-4 text-2xl font-bold tracking-tight text-ink"
        >
          {value}
        </motion.p>
      </AnimatePresence>
      <div className="mt-2 text-xs text-ink-muted">{footer}</div>
    </Card>
  );
}
