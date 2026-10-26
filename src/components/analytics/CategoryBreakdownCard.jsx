import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { ACCENTS } from '../../theme/accents.js';
import { formatMoney } from '../../utils/format.js';

// Список категорий как на мобильном макете + цветная полоска доли.
// onCategoryClick — нажатие на строку категории.
export default function CategoryBreakdownCard({ categories, texts, onCategoryClick, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <LinkArrow>{texts.allLink}</LinkArrow>
      </div>

      <ul className="-mx-2 mt-3">
        {categories.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={onCategoryClick}
              className="group flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors duration-200 hover:bg-surface"
            >
              <IconTile icon={c.icon} accent={c.accent} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="font-semibold text-ink">{formatMoney(c.amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      className={`h-full rounded-full ${ACCENTS[c.accent].dot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.share}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-ink-muted">{c.share}%</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
