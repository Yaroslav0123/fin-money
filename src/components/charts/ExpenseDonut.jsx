import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ACCENTS } from '../../theme/accents.js';

/**
 * Кольцевая диаграмма структуры расходов с суммой в центре.
 * Размер задаётся через className контейнера (например, «h-40 w-40»),
 * поэтому один компонент подходит и для крупной карточки, и для мини-превью.
 */
export default function ExpenseDonut({
  data,
  centerValue,
  centerCaption,
  className = '',
  valueClassName = 'text-lg',
  captionClassName = 'text-xs',
  animate = true,
}) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="share"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            paddingAngle={1.5}
            stroke="none"
            isAnimationActive={animate}
          >
            {data.map((item) => (
              <Cell key={item.id} fill={ACCENTS[item.accent].hex} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Подпись в центре кольца */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold leading-tight text-ink ${valueClassName}`}>{centerValue}</span>
        <span className={`text-ink-muted ${captionClassName}`}>{centerCaption}</span>
      </div>
    </div>
  );
}
