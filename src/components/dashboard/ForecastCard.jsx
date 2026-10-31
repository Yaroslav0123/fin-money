import { CircleCheck, TrendingUp, TriangleAlert } from 'lucide-react';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconTile from '../ui/IconTile.jsx';
import { formatDay, monthName } from '../../utils/dates.js';
import { fillTemplate, formatMoney } from '../../utils/format.js';

/**
 * «Прогноз на месяц» на «Главной»: сколько останется от доходов к концу месяца, если тратить как обычно,
 * и какие лимиты категорий по прогнозу будут превышены (с примерной датой).
 * forecast — результат monthForecast(); categories — категории (для названий); hasData — есть ли операции вообще;
 * hasBudgets — заданы ли лимиты (тогда без превышений пишем, что лимиты выдерживаются).
 */
export default function ForecastCard({ forecast, categories, today, hasData, hasBudgets, texts, className = '' }) {
  const isShort = forecast.projectedLeft < 0;
  const endDate = formatDay(forecast.endDate, today);
  const nameOf = (id) => categories.find((c) => c.id === id)?.name ?? '';

  const figures = [
    { id: 'income', label: texts.income, amount: forecast.income },
    { id: 'expenses', label: texts.expenses, amount: forecast.projectedExpenses },
    forecast.usualExpenses !== null && { id: 'usual', label: texts.usual, amount: forecast.usualExpenses },
  ].filter(Boolean);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <IconTile icon={TrendingUp} accent="brand" size="sm" />
        <div>
          <h3 className="text-base font-bold text-ink">{fillTemplate(texts.title, { month: monthName(today) })}</h3>
          <p className="text-xs text-ink-muted">{forecast.hasHistory ? texts.caption : texts.captionNoHistory}</p>
        </div>
      </div>

      {!hasData ? (
        <EmptyState icon={TrendingUp} text={texts.empty} compact />
      ) : (
        <>
          <p className="mt-5 text-sm text-ink-secondary">{fillTemplate(isShort ? texts.short : texts.left, { date: endDate })}</p>
          <p className={`mt-1 text-3xl font-extrabold tracking-tight ${isShort ? 'text-negative' : 'text-ink'}`}>
            ≈ <AnimatedMoney value={Math.abs(forecast.projectedLeft)} />
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {figures.map((figure) => (
              <div key={figure.id} className="rounded-2xl bg-surface px-4 py-3">
                <dt className="text-xs text-ink-muted">{figure.label}</dt>
                <dd className="mt-0.5 text-base font-bold text-ink">≈ {formatMoney(figure.amount)}</dd>
              </div>
            ))}
          </dl>

          {forecast.budgets.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {forecast.budgets.map((alert) => (
                <li key={alert.categoryId} className="flex items-start gap-2 text-sm text-ink-secondary">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-orange" />
                  {fillTemplate(texts.budgetAlert, { name: nameOf(alert.categoryId), date: formatDay(alert.date, today) })}
                </li>
              ))}
            </ul>
          ) : (
            hasBudgets && (
              <p className="mt-4 flex items-start gap-2 text-sm text-ink-secondary">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                {texts.budgetsOk}
              </p>
            )
          )}
        </>
      )}
    </Card>
  );
}
