import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IgnorePresence from '../ui/IgnorePresence.jsx';
import Logo from '../ui/Logo.jsx';
import { LANGUAGE, changeLanguage } from '../../data/language.js';
import { LANDING } from '../../data/mockData.js';
import Container from './Container.jsx';

const MOBILE_MENU_ID = 'landing-mobile-menu';

// Переключатель RU / EN: язык сайта и приложения (страница перезагружается)
function LanguageSwitch({ className = '' }) {
  return (
    <div role="group" aria-label={LANDING.language.label} className={`rounded-full bg-ink/[0.04] p-0.5 ${className}`}>
      {LANDING.language.options.map((option) => (
        <button
          key={option.id}
          type="button"
          lang={option.id}
          aria-pressed={option.id === LANGUAGE}
          onClick={() => changeLanguage(option.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors duration-200 ${
            option.id === LANGUAGE ? 'bg-card text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Шапка лендинга: логотип, навигация по секциям и кнопка «Мои финансы».
 * Прилипает к верху страницы с размытием фона.
 * На телефонах разделы открываются кнопкой-«бургером» в выпадающей панели.
 * Переключатель RU / EN меняет язык сайта и приложения (страница перезагружается).
 */
export default function LandingHeader({ appName, nav, actionLabel, onAction }) {
  const [activeId, setActiveId] = useState(nav[0].id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Escape закрывает мобильное меню
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMenuOpen]);

  // Переход к разделу: отмечаем пункт и закрываем мобильное меню
  const handleNavClick = (id) => {
    setActiveId(id);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 sm:gap-6">
        <a href="#top" onClick={() => handleNavClick(nav[0].id)}>
          <Logo name={appName} size="sm" />
        </a>

        {/* Навигация (на телефонах и планшетах — в выпадающем меню) */}
        <nav className="hidden items-center gap-4 lg:flex xl:gap-8">
          {nav.map((item) => {
            const isActive = item.id === activeId;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`relative whitespace-nowrap py-1 text-sm transition-colors duration-200 ${
                  isActive ? 'font-semibold text-ink' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {item.label}
                {/* Подчёркивание активного пункта плавно переезжает */}
                {isActive && (
                  <IgnorePresence>
                    <motion.span
                      layoutId="landing-nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-brand"
                    />
                  </IgnorePresence>
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* На телефоне места не хватает: там переключатель — в меню разделов */}
          <LanguageSwitch className="hidden sm:flex" />
          <Button size="sm" pill className="whitespace-nowrap" onClick={onAction}>
            {actionLabel}
          </Button>
          <button
            type="button"
            aria-label={isMenuOpen ? LANDING.menuCloseLabel : LANDING.menuOpenLabel}
            aria-expanded={isMenuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-ink/5 lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Мобильное меню разделов */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            id={MOBILE_MENU_ID}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full border-b border-line/60 bg-surface shadow-soft lg:hidden"
          >
            <Container className="flex flex-col py-2">
              {nav.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`rounded-xl px-3 py-3 text-sm transition-colors duration-200 hover:bg-ink/5 ${
                      isActive ? 'font-semibold text-brand' : 'text-ink-secondary'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="text-sm text-ink-secondary">{LANDING.language.label}</span>
                <LanguageSwitch className="flex" />
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
