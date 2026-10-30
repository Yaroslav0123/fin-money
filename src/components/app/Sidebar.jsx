import { motion } from 'framer-motion';
import { ArrowLeft, PiggyBank } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IgnorePresence from '../ui/IgnorePresence.jsx';
import Logo from '../ui/Logo.jsx';
import { APP_NAME, APP_NAV, APP_SHELL } from '../../data/mockData.js';

/**
 * Боковое меню веб-приложения (видно на широких экранах).
 * Пункты без готового экрана (screen: null) показаны, но неактивны.
 */
export default function Sidebar({ activeScreen, onNavigate, onExit }) {
  const { promo } = APP_SHELL;

  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-card px-5 py-7 lg:flex">
      <button type="button" onClick={onExit} className="px-2 text-left" title={APP_SHELL.backToSite}>
        <Logo name={APP_NAME} size="sm" />
      </button>

      <nav aria-label={APP_SHELL.navLabel} className="mt-10 flex flex-col gap-1">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.screen === activeScreen;
          const isDisabled = !item.screen;

          return (
            <button
              key={item.id}
              type="button"
              disabled={isDisabled}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.screen)}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 disabled:cursor-default disabled:opacity-50 ${
                isActive ? 'font-semibold text-brand' : 'text-ink-secondary enabled:hover:bg-ink/[0.03] enabled:hover:text-ink'
              }`}
            >
              {/* Подложка активного пункта плавно переезжает */}
              {isActive && (
                <IgnorePresence>
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-brand-light"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                </IgnorePresence>
              )}
              <Icon className="relative h-[18px] w-[18px]" />
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Промо-карточка накопительного счёта */}
      <div className="mt-auto overflow-hidden rounded-card bg-gradient-to-br from-brand-dark to-brand-fill p-5 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <PiggyBank className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-bold">{promo.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{promo.text}</p>
        <Button variant="outlineLight" size="sm" pill fullWidth className="mt-4" onClick={() => onNavigate('savings')}>
          {promo.action}
        </Button>
      </div>

      <button
        type="button"
        onClick={onExit}
        className="mt-5 flex items-center gap-2 px-3 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {APP_SHELL.backToSite}
      </button>
    </aside>
  );
}
