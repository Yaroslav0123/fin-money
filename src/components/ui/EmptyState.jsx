import IconTile from './IconTile.jsx';

/**
 * Пустое состояние карточки: крупная иконка на мягком пятне, пояснение и, если нужно, кнопка.
 * icon — иконка lucide по смыслу блока; action — кнопка или ссылка под текстом.
 * compact — в одну строку (на широком экране): для блоков, которые не должны растягивать страницу.
 */
export default function EmptyState({ icon, text, action = null, compact = false, className = '' }) {
  if (compact) {
    return (
      <div className={`mt-4 flex flex-col items-start gap-4 rounded-2xl bg-surface p-4 sm:flex-row sm:items-center ${className}`}>
        <IconTile icon={icon} accent="brand" />
        <p className="flex-1 text-sm leading-relaxed text-ink-muted">{text}</p>
        {action}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 py-8 text-center ${className}`}>
      <span className="relative">
        <span className="absolute -inset-3 rounded-full bg-brand-light blur-md" aria-hidden="true" />
        <IconTile icon={icon} accent="brand" size="lg" className="relative" />
      </span>
      <p className="max-w-xs text-sm leading-relaxed text-ink-muted">{text}</p>
      {action}
    </div>
  );
}
