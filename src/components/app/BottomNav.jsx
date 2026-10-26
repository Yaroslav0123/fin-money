import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { BOTTOM_NAV } from '../../data/mockData.js';

/**
 * Нижняя панель навигации для узких экранов — как в мобильном макете,
 * с выделенной круглой кнопкой «+» по центру.
 */
export default function BottomNav({ activeScreen, onNavigate, onAdd }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid h-[72px] max-w-lg grid-cols-5 items-center">
        {BOTTOM_NAV.map((item) => {
          // Центральная кнопка «Добавить»
          if (item.isAction) {
            return (
              <div key={item.id} className="flex justify-center">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  aria-label={item.label}
                  onClick={onAdd}
                  className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-button ring-4 ring-surface"
                >
                  <Plus className="h-6 w-6" strokeWidth={2.5} />
                </motion.button>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = item.screen === activeScreen;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors duration-200 ${
                isActive ? 'text-brand' : 'text-ink-muted'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
