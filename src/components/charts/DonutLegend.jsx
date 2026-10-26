import { ACCENTS } from '../../theme/accents.js';

// Легенда к кольцевой диаграмме: цветная точка, название категории и доля
export default function DonutLegend({ categories, className = '', dotClassName = 'h-2 w-2' }) {
  return (
    <ul className={`flex flex-1 flex-col ${className}`}>
      {categories.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-[0.5em]">
          <span className="flex items-center gap-[0.6em]">
            <span className={`shrink-0 rounded-full ${dotClassName} ${ACCENTS[c.accent].dot}`} />
            {c.name}
          </span>
          <span className="text-ink-muted">{c.share}%</span>
        </li>
      ))}
    </ul>
  );
}
