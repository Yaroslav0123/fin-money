import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { CHART_A11Y } from '../../data/mockData.js';
import { ACCENTS } from '../../theme/accents.js';
import { fillTemplate, formatMoney } from '../../utils/format.js';

// Толщина кольца: внутренний радиус в процентах от внешнего
const INNER_RATIO = 0.68;
// Внешний радиус оставляет запас, чтобы сектор под курсором мог «выдвинуться» наружу
const OUTER_RADIUS = '92%';
// На сколько пикселей растёт сектор под курсором
const ACTIVE_GROW = 6;
// Яркость остальных секторов, пока один выделен
const DIMMED_OPACITY = 0.35;
// Какую часть ширины «дырки» может занять сумма в центре
const CENTER_FILL = 0.82;

// Сектор под курсором: шире наружу, поэтому заметнее остальных
function ActiveSector(props) {
  return <Sector {...props} outerRadius={props.outerRadius + ACTIVE_GROW} />;
}

/**
 * Кольцевая диаграмма структуры расходов с суммой в центре.
 * Размер задаётся через className контейнера (например, «h-40 w-40»),
 * поэтому один компонент подходит и для крупной карточки, и для мини-превью.
 * Сумма в центре уменьшается, если не помещается в кольцо (крупные суммы).
 * При наведении сектор выделяется, а в центре — его сумма (или доля) и название.
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
  const [activeIndex, setActiveIndex] = useState(null);
  const [scale, setScale] = useState(1);
  const boxRef = useRef(null);
  const valueRef = useRef(null);

  const active = activeIndex === null ? null : data[activeIndex];
  const value = active ? (active.amount != null ? formatMoney(active.amount) : `${active.share}%`) : centerValue;
  const caption = active ? active.name : centerCaption;

  // Подгоняем сумму под ширину «дырки»: если текст шире — уменьшаем его
  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = valueRef.current;
    if (!box || !text) return undefined;
    const fit = () => {
      const available = box.clientWidth * (parseFloat(OUTER_RADIUS) / 100) * INNER_RATIO * CENTER_FILL;
      const width = text.offsetWidth;
      setScale(width > available && width > 0 ? available / width : 1);
    };
    fit();
    // Размер кольца может поменяться вместе с окном — пересчитываем
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [value]);

  // Описание для экранных дикторов: доли всех частей кольца
  const items = data.map((item) => `${item.name} ${item.share}%`).join(', ');

  return (
    <div ref={boxRef} className={`relative shrink-0 ${className}`} role="img" aria-label={fillTemplate(CHART_A11Y.donut, { items })}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="share"
            nameKey="name"
            innerRadius={`${parseFloat(OUTER_RADIUS) * INNER_RATIO}%`}
            outerRadius={OUTER_RADIUS}
            startAngle={90}
            endAngle={-270}
            paddingAngle={1.5}
            stroke="none"
            isAnimationActive={animate}
            activeIndex={activeIndex ?? undefined}
            activeShape={ActiveSector}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className="cursor-pointer outline-none"
          >
            {data.map((item, index) => (
              <Cell
                key={item.id}
                fill={ACCENTS[item.accent].hex}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : DIMMED_OPACITY}
                className="transition-[fill-opacity] duration-200"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Подпись в центре кольца */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          ref={valueRef}
          animate={{ scale }}
          transition={{ duration: 0.15 }}
          className={`whitespace-nowrap font-bold leading-tight text-ink ${valueClassName}`}
        >
          {value}
        </motion.span>
        <span className={`max-w-[60%] truncate text-center text-ink-muted ${captionClassName}`}>{caption}</span>
      </div>
    </div>
  );
}
