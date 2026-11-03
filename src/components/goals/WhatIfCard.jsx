import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Wand2 } from 'lucide-react';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import { DATE_TEXTS } from '../../data/mockData.js';
import { formatFullDate } from '../../utils/dates.js';
import { averageMonthlySpend, goalWhatIf, isGoalDone } from '../../utils/finance.js';
import { fillTemplate, formatMoney, plural } from '../../utils/format.js';
import { KOPECKS_IN_RUBLE } from '../../utils/money.js';

// Экономию округляем до 10 ₽ — так её проще представить
const SAVING_ROUND_TO = 10 * KOPECKS_IN_RUBLE;
const MONTHS_IN_YEAR = 12;

/**
 * Калькулятор «А что если…» на экране «Цели»: тратить на выбранную категорию на N% меньше
 * и откладывать разницу. Показывает экономию в месяц и год и для каждой активной цели — насколько раньше она придёт.
 * Обычные траты категории — среднее за последние 3 полных месяца (averageMonthlySpend).
 */
export default function WhatIfCard({ transactions, categories, goals, today, texts, className = '' }) {
  const sliderId = useId();
  // Категории с тратами — от самой крупной; по умолчанию выбрана она
  const options = categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({ ...c, usual: averageMonthlySpend(transactions, c.id, today) }))
    .filter((c) => c.usual > 0)
    .sort((a, b) => b.usual - a.usual);
  const [categoryId, setCategoryId] = useState(options[0]?.id ?? '');
  const [percent, setPercent] = useState(texts.range.default);
  const category = options.find((c) => c.id === categoryId) ?? options[0];
  const activeGoals = goals.filter((g) => !isGoalDone(g));

  const saving = category ? Math.round((category.usual * percent) / 100 / SAVING_ROUND_TO) * SAVING_ROUND_TO : 0;
  const monthsText = (count) => `${count} ${plural(count, DATE_TEXTS.monthWords)}`;

  // Подпись цели: на сколько раньше и к какой дате
  const goalLine = (goal) => {
    const result = goalWhatIf(goal, today, saving);
    if (!result) return texts.done;
    const date = formatFullDate(result.date);
    if (result.before === null) return fillTemplate(texts.fromZero, { date });
    const earlier = result.before - result.after;
    return earlier >= 1 ? fillTemplate(texts.earlier, { months: monthsText(earlier), date }) : fillTemplate(texts.sameTime, { date });
  };

  return (
    <Card className={`overflow-hidden p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <IconTile icon={Wand2} accent="purple" size="sm" />
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{texts.caption}</p>

      {!category ? (
        <p className="mt-5 rounded-2xl bg-surface p-4 text-sm text-ink-secondary">{texts.noData}</p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-ink-muted">{texts.categoryLabel}</span>
              <span className="relative mt-1.5 block">
                <select
                  value={category.id}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-2xl bg-surface pl-4 pr-10 text-sm font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              </span>
              <span className="mt-1.5 block text-xs text-ink-muted">{fillTemplate(texts.usual, { amount: formatMoney(category.usual) })}</span>
            </label>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor={sliderId} className="text-xs font-semibold text-ink-muted">
                  {texts.cutLabel}
                </label>
                <span className="text-lg font-extrabold text-brand">{percent}%</span>
              </div>
              <input
                id={sliderId}
                type="range"
                min={texts.range.min}
                max={texts.range.max}
                step={texts.range.step}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="mt-2 w-full cursor-pointer accent-brand"
              />
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-brand-light to-surface p-4">
              <p className="text-2xl font-extrabold tracking-tight text-brand">
                <AnimatedMoney value={saving} format={(value) => fillTemplate(texts.saving, { amount: formatMoney(value) })} />
              </p>
              <p className="mt-1 text-xs text-ink-muted">{fillTemplate(texts.yearly, { amount: formatMoney(saving * MONTHS_IN_YEAR) })}</p>
            </div>
          </div>

          {activeGoals.length === 0 ? (
            <p className="self-center rounded-2xl bg-surface p-4 text-sm text-ink-secondary">{texts.noGoals}</p>
          ) : (
            <ul className="space-y-2 self-start">
              {activeGoals.map((goal) => (
                <li key={goal.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <IconTile icon={goal.icon} accent={goal.accent} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{goal.name}</p>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={goalLine(goal)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs text-ink-secondary"
                      >
                        {goalLine(goal)}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
