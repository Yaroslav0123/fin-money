import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from 'lucide-react';
import { APP_SHELL, PROFILE_MENU } from '../../data/mockData.js';

/**
 * Круглая кнопка профиля в шапке и выпадающее меню под ней: «Профиль», «Настройки».
 * На телефоне это вход в настройки — их нет в нижней панели.
 * Закрывается по Esc (фокус возвращается на кнопку), по клику мимо и после выбора пункта.
 * onNavigate(screen, params) — переход к экрану.
 */
export default function ProfileMenu({ activeScreen, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const choose = (item) => {
    setIsOpen(false);
    onNavigate(item.screen, item.params);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={APP_SHELL.profileLabel}
        aria-expanded={isOpen}
        aria-controls="profile-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand transition-colors duration-200 hover:bg-brand-muted"
      >
        <User className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id="profile-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-card bg-card p-2 shadow-lifted"
          >
            {PROFILE_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = item.screen === activeScreen && !item.params;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => choose(item)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-200 hover:bg-surface ${
                      isActive ? 'font-semibold text-brand' : 'text-ink'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
