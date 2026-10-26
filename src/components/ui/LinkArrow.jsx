import { ChevronRight } from 'lucide-react';

// Маленькая серая ссылка «Все ›» в заголовках блоков
export default function LinkArrow({ children, href = '#', className = '' }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-0.5 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand ${className}`}
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </a>
  );
}
