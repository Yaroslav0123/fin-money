import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { formatSignedMoney } from '../../utils/format.js';

// Одна строка операции. Новые строки плавно появляются, остальные сдвигаются.
// forwardRef нужен AnimatePresence mode="popLayout": он измеряет уходящую строку через ref.
// onSelect — открыть операцию (изменить, удалить).
export const TransactionRow = forwardRef(function TransactionRow({ tx, onSelect, showDate = true }, ref) {
  const isIncome = tx.amount > 0;

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        onClick={() => onSelect(tx)}
        className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors duration-200 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <IconTile icon={tx.icon} accent={tx.accent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{tx.title}</p>
          <p className="truncate text-xs text-ink-muted">
            {tx.category}
            {showDate && ` · ${tx.dateLabel}`}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-bold ${isIncome ? 'text-positive' : 'text-ink'}`}>
          {formatSignedMoney(tx.amount)}
        </span>
      </button>
    </motion.li>
  );
});

// Карточка «Последние операции». onAdd — кнопка в пустом состоянии.
export default function TransactionsCard({ transactions, texts, onSelect, onAdd, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        {transactions.length > 0 && <LinkArrow to="transactions">{texts.allLink}</LinkArrow>}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-sm text-ink-muted">{texts.empty}</p>
          <Button size="sm" pill onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {texts.addFirst}
          </Button>
        </div>
      ) : (
        // grid-cols-1: колонка не шире экрана, длинные названия обрезаются многоточием
        <ul className="-mx-2 mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onSelect={onSelect} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
