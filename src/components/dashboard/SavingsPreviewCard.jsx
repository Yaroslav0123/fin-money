import { ChevronRight, PiggyBank } from 'lucide-react';
import IconTile from '../ui/IconTile.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import { formatMoney } from '../../utils/format.js';

// Компактная карточка накопительного счёта — по клику открывает экран «Накопления»
export default function SavingsPreviewCard({ savings, texts, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col rounded-card bg-brand-light/70 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="flex w-full items-start justify-between">
        <IconTile icon={PiggyBank} accent="white" />
        <ChevronRight className="h-5 w-5 text-ink-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand" />
      </div>
      <p className="mt-5 text-xs font-medium text-ink-muted">
        {texts.title} · {texts.caption}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{formatMoney(savings.balance)}</p>
      <TrendBadge trend={savings.trend} size="sm" className="mt-3" />
    </button>
  );
}
