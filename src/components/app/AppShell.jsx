import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import BottomNav from './BottomNav.jsx';
import CommandPalette from './CommandPalette.jsx';
import NotificationsDialog from './NotificationsDialog.jsx';
import OnboardingDialog from './OnboardingDialog.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ACHIEVEMENTS, APP_SHELL, DASHBOARD, DATE_TEXTS, SCREEN_META, SETTINGS_PAGE } from '../../data/mockData.js';
import { buildAchievements } from '../../utils/achievements.js';
import { monthName } from '../../utils/dates.js';
import { downloadBackup } from '../../utils/download.js';
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
 * «Загрузить выписку» и «Добавить операцию» открывают общие диалоги (AppActionsContext). Операцию — и кнопкой в шапке,
 * и круглой «+» в нижней панели. При первом входе показывается знакомство с приложением.
 * Ctrl+K (⌘K) открывает быстрый поиск. Когда появляется новое достижение — короткое уведомление с кубком.
 * onExit — возврат на лендинг.
 */
export default function AppShell({ activeScreen, onNavigate, onExit, children }) {
  const { openAddTransaction, openImport, openTransaction, openRecap, openAchievements, notify } = useAppActions();
  const finance = useFinance();
  const { today, rawTransactions, transactions, goals, summary, budgets, settings, onboardingDone, isDark, setSetting } = finance;
  const { seenAchievements, markAchievementsSeen, exportBackup } = finance;
  const themeTexts = SETTINGS_PAGE.preferences.theme;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const toggleTheme = useCallback(() => setSetting('theme', isDark ? 'light' : 'dark'), [isDark, setSetting]);

  // Ctrl+K / ⌘K — быстрый поиск из любого места приложения
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Новые достижения: в первый раз (seenAchievements — null) уже полученные отмечаются молча
  const unlockedKey = buildAchievements(finance)
    .items.filter((item) => item.unlocked)
    .map((item) => item.id)
    .join('|');
  useEffect(() => {
    const unlocked = unlockedKey ? unlockedKey.split('|') : [];
    if (seenAchievements === null) {
      markAchievementsSeen(unlocked);
      return;
    }
    const fresh = unlocked.filter((id) => !seenAchievements.includes(id));
    if (fresh.length === 0) return;
    markAchievementsSeen(fresh);
    const first = ACHIEVEMENTS.items.find((item) => item.id === fresh[0]);
    const text =
      fresh.length === 1 ? fillTemplate(ACHIEVEMENTS.newOne, { title: first.title }) : fillTemplate(ACHIEVEMENTS.newMany, { count: fresh.length });
    // Сначала дочитывается уведомление о самом действии (например, «Импортировано операций»)
    notify(text, Trophy, { whenFree: true });
  }, [unlockedKey, seenAchievements, markAchievementsSeen, notify]);

  // Действия быстрого поиска (id — из COMMAND_PALETTE.actions)
  const runCommand = (id) => {
    const commands = {
      add: openAddTransaction,
      import: () => openImport(),
      recap: openRecap,
      achievements: openAchievements,
      theme: toggleTheme,
      backup: () => {
        downloadBackup(exportBackup());
        notify(SETTINGS_PAGE.backup.downloaded);
      },
    };
    commands[id]?.();
  };

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
        className="sr-only z-[80] rounded-full bg-brand-fill px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {APP_SHELL.skipLink}
      </a>
      <Sidebar activeScreen={activeScreen} onNavigate={onNavigate} onExit={onExit} />

      <div className="min-w-0 pb-28 lg:pb-12">
        <Topbar
          title={meta.title}
          subtitle={subtitle}
          activeScreen={activeScreen}
          onNavigate={onNavigate}
          onExit={onExit}
          onAdd={openAddTransaction}
          onImport={() => openImport()}
          onSearch={(query) => onNavigate('transactions', { query })}
          onCommand={() => setIsCommandOpen(true)}
          hasNotifications={notifications.length > 0}
          onNotifications={() => setIsNotificationsOpen(true)}
          theme={{
            isDark,
            toggleLabel: isDark ? themeTexts.toggleToLight : themeTexts.toggleToDark,
            onToggle: toggleTheme,
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
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        transactions={transactions}
        goals={goals}
        onNavigate={onNavigate}
        onAction={runCommand}
        onTransaction={openTransaction}
      />
    </div>
  );
}
