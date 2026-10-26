import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Logo from '../ui/Logo.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import Container from './Container.jsx';

/**
 * Шапка лендинга: логотип, навигация по секциям, уведомления и кнопка «Начать».
 * Прилипает к верху страницы с размытием фона.
 */
export default function LandingHeader({ appName, nav, actionLabel, onAction }) {
  const [activeId, setActiveId] = useState(nav[0].id);
  const { notifySoon } = useAppActions();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#top" onClick={() => setActiveId(nav[0].id)}>
          <Logo name={appName} size="sm" />
        </a>

        {/* Навигация (на мобильных скрыта) */}
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => {
            const isActive = item.id === activeId;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveId(item.id)}
                className={`relative py-1 text-sm transition-colors duration-200 ${
                  isActive ? 'font-semibold text-ink' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {item.label}
                {/* Подчёркивание активного пункта плавно переезжает */}
                {isActive && (
                  <motion.span
                    layoutId="landing-nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-brand"
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Уведомления"
            onClick={notifySoon}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-black/5"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-accent-pink" />
          </button>
          <Button size="sm" pill onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </Container>
    </header>
  );
}
