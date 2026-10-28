import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { formatSignedMoney } from '../../utils/format.js';

// Одна строка операции. Новые строки плавно появляются, остальные сдвигаются.
// forwardRef нужен AnimatePresence mode="popLayout": он измеряет уходящую строку через ref.
const TransactionRow = forwardRef(function TransactionRow({ tx }, ref) {
  const isIncome = tx.amount > 0;

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors duration-200 hover:bg-surface"
    >
      <IconTile icon={tx.icon} accent={tx.accent} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{tx.title}</p>
        <p className="truncate text-xs text-ink-muted">
          {tx.category} · {tx.date}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-bold ${isIncome ? 'text-positive' : 'text-ink'}`}>
        {formatSignedMoney(tx.amount)}
      </span>
    </motion.li>
  );
});

// Карточка «Последние операции»
export default function TransactionsCard({ transactions, texts, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <LinkArrow>{texts.allLink}</LinkArrow>
      </div>
      {/* grid-cols-1: колонка не шире экрана, длинные названия обрезаются многоточием */}
      <ul className="-mx-2 mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
