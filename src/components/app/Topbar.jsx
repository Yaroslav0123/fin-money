import { Bell, Plus, Search, User } from 'lucide-react';
import Button from '../ui/Button.jsx';
import LeafMark from '../ui/LeafMark.jsx';
import { APP_SHELL } from '../../data/mockData.js';

/**
 * Верхняя панель экрана: заголовок, поиск, уведомления, профиль.
 * На узких экранах слева появляется знак логотипа (ведёт на сайт).
 */
export default function Topbar({ title, subtitle, onExit, onAdd, onProfile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-surface/85 backdrop-blur-md">
      <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onExit} className="shrink-0 lg:hidden" aria-label={APP_SHELL.backToSite}>
            <LeafMark className="h-7 w-9" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
            <p className="hidden truncate text-sm text-ink-muted sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Поиск (на широких экранах) */}
          <label className="hidden h-11 w-64 items-center gap-2 rounded-full bg-white px-4 shadow-soft xl:flex">
            <Search className="h-4 w-4 text-ink-muted" />
            <input
              type="search"
              placeholder={APP_SHELL.searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </label>

          <button
            type="button"
            aria-label={APP_SHELL.notificationsLabel}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full border-2 border-white bg-accent-pink" />
          </button>

          <Button size="sm" pill className="hidden h-11 sm:inline-flex" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {APP_SHELL.addAction}
          </Button>

          {/* Профиль ведёт в настройки (на телефоне это единственный вход туда) */}
          <button
            type="button"
            aria-label={APP_SHELL.profileLabel}
            onClick={onProfile}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand transition-colors duration-200 hover:bg-brand-muted"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
