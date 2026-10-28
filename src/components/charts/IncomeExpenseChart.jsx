import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_A11Y } from '../../data/mockData.js';
import { colors } from '../../theme/colors.js';
import { fillTemplate, formatCompact, formatMoney } from '../../utils/format.js';
import ChartTooltip from './ChartTooltip.jsx';

// Настройки внешнего вида графика
const AXIS_TICK = { fontSize: 11, fill: colors.ink.muted };
const BAR_RADIUS = [5, 5, 0, 0];

// Цвета серий (в легенде карточки им соответствуют классы bg-brand и bg-brand-muted)
const SERIES = {
  income: colors.brand.DEFAULT,
  expenses: colors.brand.muted,
};

// Сгруппированные столбцы «доходы / расходы» по месяцам
export default function IncomeExpenseChart({ data, labels, className = '' }) {
  // Описание для экранных дикторов: доходы и расходы по каждому месяцу
  const items = data
    .map((row) => fillTemplate(CHART_A11Y.comparisonItem, { label: row.label, income: formatMoney(row.income), expenses: formatMoney(row.expenses) }))
    .join('; ');

  return (
    <div className={className} role="img" aria-label={fillTemplate(CHART_A11Y.comparison, { items })}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 4, left: -8, bottom: 0 }} barGap={4} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={colors.line} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} dy={8} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.brand.light, opacity: 0.6 }} />
          <Bar dataKey="income" name={labels.income} fill={SERIES.income} radius={BAR_RADIUS} maxBarSize={22} />
          <Bar dataKey="expenses" name={labels.expenses} fill={SERIES.expenses} radius={BAR_RADIUS} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
