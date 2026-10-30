// Строка настройки: иконка, название, подсказка и элемент управления справа.
// as="button" — вся строка кликабельна (для пунктов-ссылок).
// Если рядом с подписью не хватает места, элемент управления переносится на следующую строку, а не наезжает на неё.
export default function SettingRow({ as: Tag = 'div', icon: Icon, label, hint, children, className = '', ...props }) {
  return (
    <Tag className={`flex w-full flex-wrap items-center gap-x-3 gap-y-2 py-3.5 text-left ${className}`} {...props}>
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-secondary">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-[7rem] flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      {children}
    </Tag>
  );
}
