// Заголовок секции лендинга: маленькая надпись сверху, заголовок и описание
export default function SectionHeading({ eyebrow, title, description, action, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-6 ${className}`}>
      <div className="max-w-md">
        <p className="text-xs font-medium text-ink-muted">{eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </div>
  );
}
