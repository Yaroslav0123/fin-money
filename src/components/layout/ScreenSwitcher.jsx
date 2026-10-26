import { motion } from 'framer-motion';

/**
 * Демо-переключатель экранов (вне интерфейса приложения).
 * Нужен, чтобы быстро посмотреть любой из экранов прототипа.
 */
export default function ScreenSwitcher({ screens, activeId, onChange }) {
  return (
    <nav className="no-scrollbar w-full max-w-phone shrink-0 overflow-x-auto px-4 py-3 sm:max-w-none sm:px-0 sm:py-0">
      <div className="mx-auto flex w-max gap-1 rounded-full bg-white/70 p-1 shadow-soft backdrop-blur">
        {screens.map((screen) => {
          const isActive = screen.id === activeId;
          return (
            <button
              key={screen.id}
              type="button"
              onClick={() => onChange(screen.id)}
              className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                isActive ? 'text-white' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {/* Плавно «переезжающая» подложка активного таба */}
              {isActive && (
                <motion.span
                  layoutId="screen-switcher-pill"
                  className="absolute inset-0 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{screen.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
