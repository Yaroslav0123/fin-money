import { formatMoney } from '../../utils/format.js';

/**
 * Общая всплывающая подсказка для графиков Recharts.
 * Для одной серии показывает подпись и сумму, для нескольких — список «название: сумма».
 */
export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const isMultiple = payload.length > 1;

  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lifted">
      <div className="text-white/60">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="mt-0.5 flex items-center gap-1.5 font-bold">
          {isMultiple && <span className="font-normal text-white/70">{item.name}:</span>}
          {formatMoney(item.value)}
        </div>
      ))}
    </div>
  );
}
