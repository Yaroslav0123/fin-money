// Строка настройки: иконка, название, подсказка и элемент управления справа.
// as="button" — вся строка кликабельна (для пунктов-ссылок).
export default function SettingRow({ as: Tag = 'div', icon: Icon, label, hint, children, className = '', ...props }) {
  return (
    <Tag className={`flex w-full items-center gap-3 py-3.5 text-left ${className}`} {...props}>
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-secondary">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      {children}
    </Tag>
  );
}
