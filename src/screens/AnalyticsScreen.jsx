import { useState } from 'react';
import { CalendarDays, CalendarRange, Wallet } from 'lucide-react';
import CategoryBreakdownCard from '../components/analytics/CategoryBreakdownCard.jsx';
import InsightsCard from '../components/analytics/InsightsCard.jsx';
import KpiCard from '../components/analytics/KpiCard.jsx';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart.jsx';
import SpendingBarChart from '../components/charts/SpendingBarChart.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import TrendBadge from '../components/ui/TrendBadge.jsx';
import {
  ANALYTICS_PAGE,
  ANALYTICS_PERIODS,
  EXPENSE_CATEGORIES,
  INCOME_VS_EXPENSES,
  INSIGHTS,
} from '../data/mockData.js';
import { useFinance } from '../context/FinanceContext.jsx';
import { addExpensesToCategories, applyExpensesToPeriod } from '../utils/analytics.js';
import { formatMoney, scaleCategories } from '../utils/format.js';

// Для расходов снижение — хорошо, поэтому зелёный бейдж при отрицательной динамике
const expenseTone = (trend) => (trend.percent <= 0 ? 'positive' : 'negative');

/**
 * Экран 4. Аналитика (веб-версия).
 * Переключатель периода меняет показатели, столбчатую диаграмму и суммы категорий.
 * Траты, добавленные через «Добавить операцию», учитываются в итоге,
 * «сегодняшнем» столбце и категориях.
 */
export default function AnalyticsScreen() {
  const [periodId, setPeriodId] = useState(ANALYTICS_PAGE.defaultPeriod);
  const { addedExpenses, summary } = useFinance();
  const { kpi } = ANALYTICS_PAGE;

  // Период с учётом трат, добавленных через «Добавить операцию» (они «сегодняшние»)
  const basePeriod = ANALYTICS_PERIODS.find((p) => p.id === periodId);
  const period = applyExpensesToPeriod(basePeriod, addedExpenses);

  // Категории под выбранный период + новые траты, крупнейшая — первая после сортировки
  const categories = addExpensesToCategories(
    scaleCategories(EXPENSE_CATEGORIES, basePeriod.total),
    addedExpenses,
    period.total,
  );

  // Последний месяц сравнения «доходы / расходы» — текущий, берём актуальные суммы
  const comparison = INCOME_VS_EXPENSES.map((row, index) =>
    index === INCOME_VS_EXPENSES.length - 1
      ? { ...row, income: summary.income.amount, expenses: summary.expenses.amount }
      : row,
  );
  const topCategory = [...categories].sort((a, b) => b.amount - a.amount)[0];
  const tone = expenseTone(period.trend);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Выбор периода */}
      <Reveal className="flex flex-wrap items-center justify-between gap-3 lg:col-span-3">
        <SegmentedControl
          id="analytics-period"
          options={ANALYTICS_PERIODS}
          value={periodId}
          onChange={setPeriodId}
          className="bg-white shadow-soft"
        />
        <button
          type="button"
          aria-label={ANALYTICS_PAGE.calendarLabel}
          className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light"
        >
          <CalendarDays className="h-4 w-4 text-brand" />
          {period.rangeLabel}
        </button>
      </Reveal>

      {/* Ключевые показатели */}
      <Reveal delay={0.05}>
        <KpiCard
          icon={Wallet}
          accent="brand"
          label={kpi.expenses}
          value={formatMoney(period.total)}
          footer={
            <span className="flex flex-wrap items-center gap-2">
              <TrendBadge trend={period.trend} tone={tone} size="sm" />
              {kpi.vsPrevious}
            </span>
          }
        />
      </Reveal>
      <Reveal delay={0.1}>
        <KpiCard
          icon={CalendarRange}
          accent="blue"
          label={kpi.perDay}
          value={formatMoney(Math.round(period.total / period.days))}
          footer={period.rangeLabel}
        />
      </Reveal>
      <Reveal delay={0.15}>
        <KpiCard
          icon={topCategory.icon}
          accent={topCategory.accent}
          label={kpi.topCategory}
          value={topCategory.name}
          footer={`${formatMoney(topCategory.amount)} · ${topCategory.share}% ${kpi.shareOfTotal}`}
        />
      </Reveal>

      {/* Столбчатая диаграмма расходов */}
      <Reveal delay={0.1} className="lg:col-span-2">
        <Card className="h-full p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-ink-muted">{period.chartTitle}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl font-bold tracking-tight text-ink">{formatMoney(period.total)}</span>
                <TrendBadge trend={period.trend} tone={tone} />
              </div>
            </div>
          </div>
          <SpendingBarChart key={period.id} data={period.bars} className="mt-6 h-72" />
        </Card>
      </Reveal>
      <Reveal delay={0.15}>
        <CategoryBreakdownCard categories={categories} texts={ANALYTICS_PAGE.categories} className="h-full" />
      </Reveal>

      {/* Доходы против расходов */}
      <Reveal delay={0.1} className="lg:col-span-2">
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
        <InsightsCard insights={INSIGHTS} title={ANALYTICS_PAGE.insights.title} className="h-full" />
      </Reveal>
    </div>
  );
}
