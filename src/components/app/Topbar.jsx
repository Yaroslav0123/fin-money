import { useState } from 'react';
import { Bell, Moon, Plus, Search, Sun, Upload, User } from 'lucide-react';
import Button from '../ui/Button.jsx';
import LeafMark from '../ui/LeafMark.jsx';
import { APP_SHELL } from '../../data/mockData.js';

/**
 * Верхняя панель экрана: заголовок, поиск, уведомления, профиль.
 * На узких экранах слева появляется знак логотипа (ведёт на сайт).
 * onSearch(query) — поиск по операциям (открывает экран «Операции» с запросом).
 * hasNotifications — показать красную точку на колокольчике.
 * theme — { isDark, toggleLabel, onToggle }: быстрое переключение светлой и тёмной темы.
 * onImport — загрузка выписки (на самых широких экранах — с подписью, иначе круглая кнопка).
 */
export default function Topbar({ title, subtitle, onExit, onAdd, onImport, onProfile, onSearch, hasNotifications, onNotifications, theme }) {
  const ThemeIcon = theme.isDark ? Sun : Moon;
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query.trim());
    setQuery('');
  };

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
          {/* Поиск по операциям (на широких экранах; на узких — на экране «Операции») */}
          <form role="search" onSubmit={handleSearch} className="hidden h-11 w-64 items-center gap-2 rounded-full bg-card px-4 shadow-soft xl:flex">
            <Search className="h-4 w-4 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={APP_SHELL.searchPlaceholder}
              placeholder={APP_SHELL.searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </form>

          {/* На самых узких экранах прячем: тема есть в «Настройках» */}
          <button
            type="button"
            aria-label={theme.toggleLabel}
            title={theme.toggleLabel}
            onClick={theme.onToggle}
            className="hidden h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light min-[400px]:flex"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label={APP_SHELL.importAction}
            title={APP_SHELL.importAction}
            onClick={onImport}
            className="flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-card text-sm font-semibold text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light 2xl:w-auto 2xl:px-5"
          >
            <Upload className="h-5 w-5 shrink-0" />
            <span className="hidden 2xl:inline">{APP_SHELL.importAction}</span>
          </button>

          <button
            type="button"
            aria-label={APP_SHELL.notificationsLabel}
            onClick={onNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-soft transition-colors duration-200 hover:bg-brand-light"
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full border-2 border-card bg-accent-pink" />
            )}
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
