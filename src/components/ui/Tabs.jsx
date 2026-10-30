import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import IgnorePresence from './IgnorePresence.jsx';

/**
 * Вкладки разделов (например, в «Настройках»): ряд кнопок с иконками, на узком экране листается вбок.
 * tabs — [{ id, label, icon }]; id — имя для связи вкладок с панелью: панель должна иметь id `${id}-panel`.
 * Стрелки влево и вправо переключают вкладки, как принято для role="tablist".
 * Если ряд не помещается, выбранная вкладка прокручивается к середине — её всегда видно целиком.
 */
export default function Tabs({ id, label, tabs, value, onChange, className = '' }) {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector('[aria-selected="true"]');
    if (!active || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
  }, [value]);

  const handleKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === value);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`${id}-tab-${next.id}`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={`no-scrollbar relative flex max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1.5 shadow-soft ${className}`}
    >
      {tabs.map(({ id: tabId, label: tabLabel, icon: Icon }) => {
        const isActive = tabId === value;
        return (
          <button
            key={tabId}
            id={`${id}-tab-${tabId}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${id}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tabId)}
            className={`relative flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              isActive ? 'text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <IgnorePresence>
                <motion.span
                  layoutId={`${id}-tab`}
                  className="absolute inset-0 rounded-full bg-brand-fill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              </IgnorePresence>
            )}
            {Icon && <Icon className="relative h-4 w-4" />}
            <span className="relative">{tabLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
