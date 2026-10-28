import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_A11Y } from '../../data/mockData.js';
import { colors } from '../../theme/colors.js';
import { fillTemplate, formatCompact, formatMoney } from '../../utils/format.js';
import ChartTooltip from './ChartTooltip.jsx';

// Настройки внешнего вида графика
const AXIS_TICK = { fontSize: 11, fill: colors.ink.muted };
const BAR_RADIUS = [6, 6, 6, 6];

/**
 * Столбчатая диаграмма расходов, как на мобильном макете:
 * светло-зелёные столбцы, текущий (highlightIndex: «сейчас» или последний) — тёмный.
 * Столбец под курсором подсвечивается.
 */
export default function SpendingBarChart({ data, highlightIndex = data.length - 1, className = '' }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Описание для экранных дикторов: итог и самый «дорогой» столбец
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const peak = data.reduce((best, item) => (item.value > best.value ? item : best), data[0]);
  const description =
    total > 0
      ? fillTemplate(CHART_A11Y.spending, { total: formatMoney(total), label: peak.label, max: formatMoney(peak.value) })
      : CHART_A11Y.spendingEmpty;

  const barColor = (index) => {
    if (index === highlightIndex) return colors.brand.DEFAULT;
    if (index === hoverIndex) return colors.brand.muted;
    return colors.brand.soft;
  };

  return (
    <div className={className} role="img" aria-label={description}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 4, left: -8, bottom: 0 }}
          barCategoryGap="22%"
          onMouseMove={(state) => setHoverIndex(state?.activeTooltipIndex ?? null)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <CartesianGrid vertical={false} stroke={colors.line} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
            dy={8}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
            tickCount={4}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={false} />
          <Bar dataKey="value" radius={BAR_RADIUS} maxBarSize={36} animationDuration={600}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={barColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
