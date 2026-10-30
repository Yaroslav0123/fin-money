import { useState } from 'react';
import BottomNav from './BottomNav.jsx';
import NotificationsDialog from './NotificationsDialog.jsx';
import OnboardingDialog from './OnboardingDialog.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { APP_SHELL, DASHBOARD, DATE_TEXTS, SCREEN_META, SETTINGS_PAGE } from '../../data/mockData.js';
import { monthName } from '../../utils/dates.js';
import { notificationData } from '../../utils/finance.js';
import { fillTemplate } from '../../utils/format.js';

// Приветствие по времени суток: последнее правило, чей час уже наступил
const greetingFor = (date) => {
  const hour = date.getHours();
  const rules = DATE_TEXTS.greetings;
  return (rules.filter(([from]) => hour >= from).at(-1) ?? rules.at(-1))[1];
};

/**
 * Каркас веб-приложения: боковое меню (десктоп), верхняя панель,
 * область контента и нижняя навигация (мобильные).
 * «Добавить операцию» открывает общий диалог (AppActionsContext) — и кнопкой в шапке,
 * и круглой «+» в нижней панели. При первом входе показывается знакомство с приложением.
 * onExit — возврат на лендинг.
 */
export default function AppShell({ activeScreen, onNavigate, onExit, children }) {
  const { openAddTransaction } = useAppActions();
  const { today, rawTransactions, goals, summary, budgets, settings, onboardingDone, isDark, setSetting } = useFinance();
  const themeTexts = SETTINGS_PAGE.preferences.theme;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const meta = SCREEN_META[activeScreen];
  const subtitle =
    activeScreen === 'dashboard'
      ? fillTemplate(DASHBOARD.subtitle, { greeting: greetingFor(today), month: monthName(today) })
      : meta.subtitle;

  const notifications = notificationData({
    transactions: rawTransactions,
    goals,
    monthSpent: summary.expenses.amount,
    budgetLimit: settings.budgetLimit,
    warnAt: SETTINGS_PAGE.budget.warnAt,
    categoryBudgets: budgets,
    largeAmount: APP_SHELL.notifications.largeAmount,
    today,
  });

  return (
    <div className="min-h-full bg-surface lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      {/* Для клавиатуры: первая же клавиша Tab предлагает пропустить меню */}
      <a
        href="#main"
        className="sr-only z-[80] rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {APP_SHELL.skipLink}
      </a>
      <Sidebar activeScreen={activeScreen} onNavigate={onNavigate} onExit={onExit} />

      <div className="min-w-0 pb-28 lg:pb-12">
        <Topbar
          title={meta.title}
          subtitle={subtitle}
          onExit={onExit}
          onAdd={openAddTransaction}
          onProfile={() => onNavigate('settings')}
          onSearch={(query) => onNavigate('transactions', { query })}
          hasNotifications={notifications.length > 0}
          onNotifications={() => setIsNotificationsOpen(true)}
          theme={{
            isDark,
            toggleLabel: isDark ? themeTexts.toggleToLight : themeTexts.toggleToDark,
            onToggle: () => setSetting('theme', isDark ? 'light' : 'dark'),
          }}
        />
        <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-5 pt-6 focus:outline-none sm:px-8 lg:px-10 lg:pt-8">
          {children}
        </main>
      </div>

      <BottomNav activeScreen={activeScreen} onNavigate={onNavigate} onAdd={openAddTransaction} />

      <NotificationsDialog
        isOpen={isNotificationsOpen}
        items={notifications}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <OnboardingDialog isOpen={!onboardingDone} />
    </div>
  );
}
