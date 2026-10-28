import { motion } from 'framer-motion';
import IgnorePresence from './IgnorePresence.jsx';

/**
 * Переключатель периодов («Неделя / Месяц / Год»).
 * id — уникальное имя, чтобы анимация подложки не «перепрыгивала»
 * между разными переключателями на странице.
 */
export default function SegmentedControl({ id, options, value, onChange, className = '' }) {
  return (
    <div className={`no-scrollbar inline-flex max-w-full overflow-x-auto rounded-full bg-ink/[0.04] p-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            className={`relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <IgnorePresence>
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              </IgnorePresence>
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
