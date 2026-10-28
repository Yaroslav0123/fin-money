import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import { formatSignedMoney } from '../../utils/format.js';

const ALL_FILTER = 'all';

/**
 * История операций по накопительному счёту с фильтром по типу.
 * Новые операции (после пополнения/снятия) плавно появляются сверху.
 */
export default function SavingsHistoryCard({ transactions, types, texts, className = '' }) {
  const [filter, setFilter] = useState(ALL_FILTER);

  const filterOptions = [
    { id: ALL_FILTER, label: texts.allFilter },
    ...Object.entries(types).map(([id, type]) => ({ id, label: type.label })),
  ];
  const visible = filter === ALL_FILTER ? transactions : transactions.filter((tx) => tx.type === filter);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <SegmentedControl id="savings-history-filter" options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      <ul className="-mx-2 mt-4">
        <AnimatePresence initial={false}>
          {visible.map((tx) => {
            const type = types[tx.type];
            const isIncome = tx.amount > 0;
            return (
              <motion.li
                key={tx.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors duration-200 hover:bg-surface">
                  <IconTile icon={type.icon} accent={type.accent} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{type.title}</p>
                    <p className="text-xs text-ink-muted">{tx.dateLabel}</p>
                  </div>
                  <span className={`text-sm font-bold ${isIncome ? 'text-positive' : 'text-ink'}`}>
                    {formatSignedMoney(tx.amount)}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-muted">{transactions.length === 0 ? texts.emptyAll : texts.empty}</p>
      )}
    </Card>
  );
}
