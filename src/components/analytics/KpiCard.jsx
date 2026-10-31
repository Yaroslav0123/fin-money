import { AnimatePresence, motion } from 'framer-motion';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';

const valueClass = 'mt-4 text-2xl font-bold tracking-tight text-ink';

/**
 * Карточка ключевого показателя. footer — бейдж или подпись снизу.
 * amount — сумма в копейках: плавно «докручивается» до нового значения при смене периода.
 * value — текст (например, название категории): при смене выезжает новый.
 */
export default function KpiCard({ icon, accent, label, value, amount, footer }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} accent={accent} size="sm" />
        <p className="text-xs font-medium text-ink-muted">{label}</p>
      </div>
      {amount !== undefined ? (
        <p className={valueClass}>
          <AnimatedMoney value={amount} />
        </p>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={valueClass}
          >
            {value}
          </motion.p>
        </AnimatePresence>
      )}
      <div className="mt-2 text-xs text-ink-muted">{footer}</div>
    </Card>
  );
}
