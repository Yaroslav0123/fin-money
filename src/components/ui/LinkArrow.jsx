import { ChevronRight } from 'lucide-react';
import { useAppActions } from '../../context/AppActionsContext.jsx';

/**
 * Маленькая серая ссылка «Все ›» в заголовках блоков.
 * to — экран, на который ведёт ссылка; без него показываем «Скоро будет доступно».
 */
export default function LinkArrow({ children, to, className = '' }) {
  const { navigate, notifySoon } = useAppActions();

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : notifySoon())}
      className={`inline-flex items-center gap-0.5 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand ${className}`}
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
