import { useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import CategoryBreakdownCard from '../components/analytics/CategoryBreakdownCard.jsx';
import InsightsCard from '../components/analytics/InsightsCard.jsx';
import KpiCard from '../components/analytics/KpiCard.jsx';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart.jsx';
import SpendingBarChart from '../components/charts/SpendingBarChart.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import TrendBadge from '../components/ui/TrendBadge.jsx';
import { ANALYTICS_PAGE } from '../data/mockData.js';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { categoryBreakdown, incomeVsExpenses, insightData, periodExpenses } from '../utils/finance.js';
import { fillTemplate, formatMoney, monthlyPayment } from '../utils/format.js';

// Для расходов снижение — хорошо, поэтому зелёный бейдж при отрицательной динамике
const expenseTone = (trend) => (trend.percent <= 0 ? 'positive' : 'negative');

// Коэффициент для текста: 1.47 → «1,5»
const ratioFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

// Тексты подсказок из посчитанных данных
const buildInsights = (data) => {
  const t = ANALYTICS_PAGE.insights;
  const items = [];
  if (data.hasPreviousMonth && data.monthDiff !== 0) {
    const rule = data.monthDiff < 0 ? t.less : t.more;
    items.push({ id: 'month', ...rule, text: fillTemplate(rule.text, { amount: formatMoney(Math.abs(data.monthDiff)) }) });
  }
  if (data.topCategory) {
    const { name, share, icon, accent } = data.topCategory;
    items.push({ id: 'top', icon, accent, text: fillTemplate(t.top.text, { name, share }) });
  }
  if (data.weekendRatio) {
    const rule = data.weekendRatio > 1 ? t.weekendMore : t.weekdayMore;
    const ratio = data.weekendRatio > 1 ? data.weekendRatio : 1 / data.weekendRatio;
    items.push({ id: 'weekend', ...rule, text: fillTemplate(rule.text, { ratio: ratioFormatter.format(ratio) }) });
  }
  if (data.nextGoal) {
    const { name, left, monthsLeft } = data.nextGoal;
    const payment = formatMoney(monthlyPayment(left, monthsLeft));
    items.push({ id: 'goal', ...t.goal, text: fillTemplate(t.goal.text, { name, left: formatMoney(left), payment }) });
  }
  return items;
};

/**
 * Экран 4. Аналитика (веб-версия).
 * Всё считается из истории операций: переключатель периода меняет показатели,
 * диаграмму и категории; стрелки листают периоды назад. Категория открывает свои операции.
 */
export default function AnalyticsScreen() {
  const [periodId, setPeriodId] = useState(ANALYTICS_PAGE.defaultPeriod);
  const [offset, setOffset] = useState(0);
  const { rawTransactions, categories, goals, settings, today } = useFinance();
  const { navigate } = useAppActions();
  const { kpi } = ANALYTICS_PAGE;

  const period = periodExpenses(rawTransactions, periodId, today, offset, settings.weekStart);
  const periodMeta = ANALYTICS_PAGE.periods.find((p) => p.id === periodId);
  const categoriesInPeriod = categoryBreakdown(period.transactions, categories);
  const topCategory = categoriesInPeriod[0];
  const comparison = incomeVsExpenses(rawTransactions, today);
  const insights = buildInsights(insightData(rawTransactions, categories, goals, today));
  const tone = expenseTone(period.trend);

  const changePeriod = (id) => {
    setPeriodId(id);
    setOffset(0);
  };

  const navButtonClass =
    'flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* Выбор периода и листание назад / вперёд */}
      <Reveal className="flex flex-wrap items-center justify-between gap-3 xl:col-span-3">
        <SegmentedControl
          id="analytics-period"
          options={ANALYTICS_PAGE.periods}
          value={periodId}
          onChange={changePeriod}
          className="bg-card shadow-soft"
        />
        <div className="flex items-center gap-2">
          <button type="button" aria-label={ANALYTICS_PAGE.prevLabel} onClick={() => setOffset((o) => o - 1)} className={navButtonClass}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="flex h-10 items-center rounded-full bg-card px-4 text-xs font-semibold text-ink shadow-soft" aria-live="polite">
            {period.label}
          </span>
          <button
            type="button"
            aria-label={ANALYTICS_PAGE.nextLabel}
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            className={navButtonClass}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Reveal>

      {/* Ключевые показатели */}
      <Reveal delay={0.05}>
        <KpiCard
          icon={Wallet}
          accent="brand"
          label={kpi.expenses}
          value={formatMoney(period.total)}
          footer={
            period.hasPrevious ? (
              <span className="flex flex-wrap items-center gap-2">
                <TrendBadge trend={period.trend} tone={tone} size="sm" />
                {kpi.vsPrevious}
              </span>
            ) : (
              kpi.noPrevious
            )
          }
        />
      </Reveal>
      <Reveal delay={0.1}>
        <KpiCard icon={CalendarRange} accent="blue" label={kpi.perDay} value={formatMoney(period.perDay)} footer={period.label} />
      </Reveal>
      <Reveal delay={0.15}>
        <KpiCard
          icon={topCategory?.icon ?? Wallet}
          accent={topCategory?.accent ?? 'gray'}
          label={kpi.topCategory}
          value={topCategory?.name ?? kpi.noTopCategory}
          footer={topCategory ? `${formatMoney(topCategory.amount)} · ${topCategory.share}% ${kpi.shareOfTotal}` : period.label}
        />
      </Reveal>

      {/* Столбчатая диаграмма расходов */}
      <Reveal delay={0.1} className="xl:col-span-2">
        <Card className="h-full p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-ink-muted">{periodMeta.chartTitle}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl font-bold tracking-tight text-ink">{formatMoney(period.total)}</span>
                {period.hasPrevious && <TrendBadge trend={period.trend} tone={tone} />}
              </div>
            </div>
          </div>
          <SpendingBarChart
            key={`${periodId}:${offset}`}
            data={period.bars}
            highlightIndex={period.highlightIndex}
            className="mt-6 h-72"
          />
        </Card>
      </Reveal>
      <Reveal delay={0.15}>
        <CategoryBreakdownCard
          categories={categoriesInPeriod}
          texts={ANALYTICS_PAGE.categories}
          onCategoryClick={(category) => navigate('transactions', { categoryId: category.id })}
          className="h-full"
        />
      </Reveal>

      {/* Доходы против расходов */}
      <Reveal delay={0.1} className="xl:col-span-2">
        <Card className="h-full p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">{ANALYTICS_PAGE.comparison.title}</h3>
              <p className="text-xs text-ink-muted">{ANALYTICS_PAGE.comparison.subtitle}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                {ANALYTICS_PAGE.comparison.income}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-muted" />
                {ANALYTICS_PAGE.comparison.expenses}
              </span>
            </div>
          </div>
          <IncomeExpenseChart data={comparison} labels={ANALYTICS_PAGE.comparison} className="mt-6 h-64" />
        </Card>
      </Reveal>
      <Reveal delay={0.15}>
        <InsightsCard
          insights={insights}
          title={ANALYTICS_PAGE.insights.title}
          emptyText={ANALYTICS_PAGE.insights.empty}
          className="h-full"
        />
      </Reveal>
    </div>
  );
}
