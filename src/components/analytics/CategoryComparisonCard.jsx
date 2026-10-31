import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, Minus } from 'lucide-react';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconTile from '../ui/IconTile.jsx';
import { fillTemplate, formatMoney } from '../../utils/format.js';

// Сколько категорий показывать — остальные мелкие и картину не меняют
const SHOWN = 6;

// Изменение траты: меньше — хорошо (зелёный), больше — красный. «Новая» — трат в прошлом периоде не было.
function Change({ item, texts }) {
  if (item.diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
        <Minus className="h-3.5 w-3.5" />
        {texts.same}
      </span>
    );
  }
  const isLess = item.diff < 0;
  const Icon = isLess ? ArrowDownRight : ArrowUpRight;
  const label = item.percent === null ? texts.new : `${item.percent > 0 ? '+' : ''}${item.percent}%`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isLess ? 'bg-positive-bg text-positive' : 'bg-negative-bg text-negative'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/**
 * «Сравнение с прошлым периодом» на «Аналитике»: по каждой крупной категории — сколько сейчас,
 * сколько было и куда изменилось. Нажатие на категорию — её динамика за полгода (onCategoryClick).
 */
export default function CategoryComparisonCard({ items, texts, periodLabel, onCategoryClick, className = '' }) {
  const shown = items.slice(0, SHOWN);

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="text-xs text-ink-muted">{fillTemplate(texts.caption, { period: periodLabel })}</p>

      {shown.length === 0 ? (
        <EmptyState icon={BarChart3} text={texts.empty} />
      ) : (
        <ul className="-mx-2 mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onCategoryClick(item)}
                className="group flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors duration-200 hover:bg-surface"
              >
                <IconTile icon={item.icon} accent={item.accent} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{item.name}</span>
                    <Change item={item} texts={texts} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {formatMoney(item.amount)}
                    {' · '}
                    {fillTemplate(texts.was, { amount: formatMoney(item.previous) })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
