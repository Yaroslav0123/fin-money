import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors } from '../../theme/colors.js';
import { formatCompact } from '../../utils/format.js';
import ChartTooltip from './ChartTooltip.jsx';

// Настройки внешнего вида графика
const AXIS_TICK = { fontSize: 11, fill: colors.ink.muted };
const GRADIENT_ID = 'balance-area-fill';

// Округление границ оси Y до «красивых» тысяч
const STEP = 1000;
const yDomain = [
  (min) => Math.max(0, Math.floor((min * 0.94) / STEP) * STEP),
  (max) => Math.ceil((max * 1.03) / STEP) * STEP,
];

// Точка только на последнем значении (текущий баланс)
function LastPointDot({ cx, cy, index, lastIndex }) {
  if (index !== lastIndex) return <g key={`dot-${index}`} />;
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={5}
      fill={colors.brand.DEFAULT}
      stroke={colors.brand.light}
      strokeWidth={3}
    />
  );
}

// Плавный график роста баланса накопительного счёта
export default function BalanceAreaChart({ data, className = '' }) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.brand.DEFAULT} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colors.brand.DEFAULT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.line} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
            dy={8}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
            domain={yDomain}
            tickCount={4}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.brand.muted, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.brand.DEFAULT}
            strokeWidth={2.5}
            fill={`url(#${GRADIENT_ID})`}
            dot={({ key, ...dotProps }) => (
              <LastPointDot key={key} {...dotProps} lastIndex={data.length - 1} />
            )}
            activeDot={{ r: 5, fill: colors.brand.DEFAULT, stroke: colors.brand.light, strokeWidth: 3 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
