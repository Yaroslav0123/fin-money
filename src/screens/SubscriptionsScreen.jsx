import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, ChevronDown, EyeOff, Lightbulb, ReceiptText, Repeat, RotateCcw, TrendingUp, Upload, Wallet } from 'lucide-react';
import KpiCard from '../components/analytics/KpiCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import IconTile from '../components/ui/IconTile.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { CATEGORY_ICONS, storedText, SUBSCRIPTIONS_PAGE } from '../data/mockData.js';
import { formatDay } from '../utils/dates.js';
import { subscriptions } from '../utils/finance.js';
import { fillTemplate, formatMoney } from '../utils/format.js';

const MONTHS_IN_YEAR = 12;

// Строка подписки: иконка категории, название, сумма в месяц, следующее списание и пометки
function SubscriptionRow({ item, category, today, onOperations, onHide }) {
  const t = SUBSCRIPTIONS_PAGE;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconTile icon={category?.icon ?? CATEGORY_ICONS.other} accent={item.stale ? 'gray' : category?.accent ?? 'blue'} />
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${item.stale ? 'text-ink-secondary' : 'text-ink'}`}>{item.name}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {item.stale
              ? fillTemplate(t.stale, { date: formatDay(item.lastDate, today) })
              : `${fillTemplate(t.next, { date: formatDay(item.nextDate, today) })} · ${fillTemplate(t.months, { count: item.months })}`}
          </p>
          {item.priceUp && !item.stale && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ink">
              <TrendingUp className="h-3 w-3 text-accent-orange" aria-hidden="true" />
              {fillTemplate(t.priceUp, { from: formatMoney(item.priceUp.from), to: formatMoney(item.priceUp.to) })}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className={`text-sm font-bold ${item.stale ? 'text-ink-muted line-through' : 'text-ink'}`}>
            {formatMoney(item.monthly)} <span className="text-xs font-medium text-ink-muted">{t.perMonth}</span>
          </p>
          <p className="text-xs text-ink-muted">{fillTemplate(t.perYear, { amount: formatMoney(item.yearly) })}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onOperations(item)}
            aria-label={fillTemplate(t.showOperationsLabel, { name: item.name })}
            title={t.showOperations}
            className="rounded-full p-2 text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-brand"
          >
            <ReceiptText className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onHide(item)}
            aria-label={fillTemplate(t.hideLabel, { name: item.name })}
            title={t.hide}
            className="rounded-full p-2 text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

/**
 * Экран «Подписки»: регулярные платежи, найденные в истории операций (subscriptions в utils/finance.js).
 * Сверху — сколько уходит в месяц и в год, ниже — действующие подписки с датой следующего списания и подорожанием,
 * отдельно — те, что перестали списываться. «Это не подписка» прячет строку (запоминается), её можно вернуть.
 * Значок операций открывает «Операции» с поиском по названию.
 */
export default function SubscriptionsScreen() {
  const { rawTransactions, categories, hiddenSubscriptions, hideSubscription, restoreSubscription, today } = useFinance();
  const { navigate, notify, openImport } = useAppActions();
  const [showHidden, setShowHidden] = useState(false);
  const t = SUBSCRIPTIONS_PAGE;

  const all = subscriptions(rawTransactions, today).map((item) => ({ ...item, name: storedText(item.name) }));
  const visible = all.filter((item) => !hiddenSubscriptions.includes(item.key));
  const hidden = all.filter((item) => hiddenSubscriptions.includes(item.key));
  const active = visible.filter((item) => !item.stale);
  const stale = visible.filter((item) => item.stale);
  const monthly = active.reduce((total, item) => total + item.monthly, 0);
  // Подписка, которая подорожала сильнее всех
  const raised = active.filter((item) => item.priceUp).sort((a, b) => b.priceUp.to - b.priceUp.from - (a.priceUp.to - a.priceUp.from))[0];
  const categoryOf = (item) => categories.find((c) => c.id === item.categoryId);

  const handleOperations = (item) => navigate('transactions', { query: item.name });
  const handleHide = (item) => {
    hideSubscription(item.key);
    notify(fillTemplate(t.hiddenDone, { name: item.name }));
  };
  const handleRestore = (item) => {
    restoreSubscription(item.key);
    notify(t.restored);
  };

  if (all.length === 0) {
    return (
      <Reveal>
        <Card className="p-6">
          <EmptyState
            icon={Repeat}
            text={t.empty}
            action={
              <Button size="sm" pill onClick={() => openImport()}>
                <Upload className="h-4 w-4" />
                {t.emptyAction}
              </Button>
            }
          />
        </Card>
      </Reveal>
    );
  }

  const rowProps = { today, onOperations: handleOperations, onHide: handleHide };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Reveal>
        <KpiCard icon={Repeat} accent="blue" label={t.kpi.monthly} amount={monthly} footer={t.kpi.monthlyHint} />
      </Reveal>
      <Reveal delay={0.05}>
        <KpiCard icon={Wallet} accent="purple" label={t.kpi.yearly} amount={active.reduce((total, item) => total + item.yearly, 0)} footer={t.kpi.yearlyHint} />
      </Reveal>
      <Reveal delay={0.1}>
        <KpiCard
          icon={CalendarClock}
          accent="orange"
          label={t.kpi.count}
          value={String(visible.length)}
          footer={fillTemplate(t.kpi.countHint, { active: active.length, stale: stale.length })}
        />
      </Reveal>

      <Reveal delay={0.1} className="xl:col-span-2">
        <Card className="p-6">
          <h3 className="text-base font-bold text-ink">{t.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t.caption}</p>
          <ul className="mt-2 divide-y divide-line">
            <AnimatePresence initial={false}>
              {active.map((item) => (
                <SubscriptionRow key={item.key} item={item} category={categoryOf(item)} {...rowProps} />
              ))}
            </AnimatePresence>
          </ul>

          {stale.length > 0 && (
            <>
              <h4 className="mt-6 text-sm font-bold text-ink-secondary">{t.staleTitle}</h4>
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {stale.map((item) => (
                    <SubscriptionRow key={item.key} item={item} category={categoryOf(item)} {...rowProps} />
                  ))}
                </AnimatePresence>
              </ul>
            </>
          )}

          {hidden.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowHidden((value) => !value)}
                aria-expanded={showHidden}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand"
              >
                {fillTemplate(t.hiddenTitle, { count: hidden.length })}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showHidden ? 'rotate-180' : ''}`} />
              </button>
              {showHidden && (
                <ul className="mt-2 space-y-2">
                  {hidden.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2">
                      <span className="truncate text-sm text-ink-secondary">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        aria-label={fillTemplate(t.restoreLabel, { name: item.name })}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t.restore}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </Reveal>

      {raised && (
        <Reveal delay={0.15}>
          <Card className="flex items-start gap-3 bg-gradient-to-br from-brand-light to-card p-6">
            <IconTile icon={Lightbulb} accent="brand" />
            <p className="text-sm leading-relaxed text-ink-secondary">
              {fillTemplate(t.priceTip, {
                name: raised.name,
                diff: formatMoney(raised.priceUp.to - raised.priceUp.from),
                yearly: formatMoney((raised.priceUp.to - raised.priceUp.from) * MONTHS_IN_YEAR),
              })}
            </p>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
