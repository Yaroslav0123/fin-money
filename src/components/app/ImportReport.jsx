import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import { CATEGORY_ICONS, IMPORT_DIALOG } from '../../data/mockData.js';
import { ACCENTS } from '../../theme/accents.js';
import { formatDay, formatFullDate } from '../../utils/dates.js';
import { fillTemplate, formatMoney, plural } from '../../utils/format.js';

const iconOf = (category) => CATEGORY_ICONS[category.iconId] ?? CATEGORY_ICONS.other;

/**
 * Итог импорта «Что нашли в выписке» — третий шаг окна импорта.
 * report — результат importReport. onSort — разобрать «Другое», onAnalytics — открыть аналитику, onFinish — закрыть окно.
 */
export default function ImportReport({ report, onSort, onAnalytics, onFinish }) {
  const t = IMPORT_DIALOG;
  const r = t.report;
  const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-ink-muted';

  return (
    <div aria-live="polite">
      <p className="text-base font-bold text-ink">{r.title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {report.period && `${fillTemplate(r.period, { from: formatDay(report.period.from), to: formatFullDate(report.period.to) })} · `}
        {fillTemplate(r.count, { count: report.count })}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-surface px-4 py-3">
          <dt className="text-xs text-ink-muted">{t.income}</dt>
          <dd className="mt-1 font-bold text-positive">{formatMoney(report.income)}</dd>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <dt className="text-xs text-ink-muted">{t.expenses}</dt>
          <dd className="mt-1 font-bold text-ink">{formatMoney(report.expenses)}</dd>
        </div>
      </dl>
      {report.refunds > 0 && <p className="mt-2 text-xs text-ink-muted">{fillTemplate(t.refunds, { amount: formatMoney(report.refunds) })}</p>}
      {report.transfers > 0 && <p className="mt-1 text-xs text-ink-muted">{fillTemplate(t.transfers, { count: report.transfers })}</p>}

      {report.topCategories.length > 0 && (
        <section className="mt-5">
          <h4 className={sectionTitle}>{r.topTitle}</h4>
          <ul className="mt-2 space-y-3">
            {report.topCategories.map(({ category, amount, share }) => (
              <li key={category.id} className="flex items-center gap-3">
                <IconTile icon={iconOf(category)} accent={category.accent} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-ink">{category.name}</span>
                    <span className="shrink-0 font-semibold text-ink">{formatMoney(amount)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                      <motion.div
                        className={`h-full rounded-full ${ACCENTS[category.accent].dot}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-ink-muted">{share}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.largest.length > 0 && (
        <section className="mt-5">
          <h4 className={sectionTitle}>{r.largestTitle}</h4>
          <ul className="mt-2 divide-y divide-line">
            {report.largest.map((draft, index) => (
              <li key={index} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{draft.comment || t.expenses}</span>
                  <span className="text-xs text-ink-muted">{formatDay(draft.date)}</span>
                </span>
                <span className="shrink-0 font-semibold text-ink">{formatMoney(draft.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.otherCount > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-brand-light/60 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs leading-relaxed text-ink-secondary">
            {fillTemplate(r.other, { count: report.otherCount, word: plural(report.otherCount, r.otherWords) })}
          </p>
          <Button size="sm" pill variant="ghost" onClick={onSort} className="shrink-0 bg-card">
            <Sparkles className="h-4 w-4" />
            {r.sortAction}
          </Button>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-ink-muted">{r.reconcileHint}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" onClick={onAnalytics}>
          {r.analyticsAction}
        </Button>
        <Button size="md" onClick={onFinish}>
          {r.finish}
        </Button>
      </div>
    </div>
  );
}
