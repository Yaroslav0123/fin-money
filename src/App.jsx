import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AppActionsProvider } from './context/AppActionsContext.jsx';
import { FinanceProvider } from './context/FinanceContext.jsx';
import { ScreenSkeleton } from './components/ui/Skeleton.jsx';
import { APP_SHELL } from './data/mockData.js';
import LandingPage from './screens/LandingPage.jsx';
import { trackScreen } from './utils/monitoring.js';

// Экран-лендинг (сайт). Остальные экраны живут внутри каркаса веб-приложения.
const LANDING_SCREEN = 'onboarding';

// Код приложения скачивается отдельно от лендинга: первая страница открывается быстрее.
// Пока посетитель читает лендинг, браузер в свободное время подгружает приложение заранее.
const appModules = [
  () => import('./components/app/AppShell.jsx'),
  () => import('./screens/DashboardScreen.jsx'),
  () => import('./screens/AnalyticsScreen.jsx'),
  () => import('./screens/GoalsScreen.jsx'),
  () => import('./screens/SavingsScreen.jsx'),
  () => import('./screens/SettingsScreen.jsx'),
  () => import('./screens/TransactionsScreen.jsx'),
];
const [AppShell, DashboardScreen, AnalyticsScreen, GoalsScreen, SavingsScreen, SettingsScreen, TransactionsScreen] =
  appModules.map((load) => lazy(load));

// В Safari нет requestIdleCallback — там просто ждём пару секунд
const whenIdle = (callback) => (window.requestIdleCallback ? window.requestIdleCallback(callback) : setTimeout(callback, 2000));

// Анимация смены экранов внутри приложения
const screenTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

// Анимация смены «сайт ↔ приложение»
const layoutTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

export default function App() {
  // Текущий экран и его параметры (например, поисковый запрос для «Операций»)
  const [route, setRoute] = useState({ screen: LANDING_SCREEN, params: {} });
  const activeScreen = route.screen;
  const isLanding = activeScreen === LANDING_SCREEN;
  const navigate = useCallback((screen, params = {}) => setRoute({ screen, params }), []);
  const exitToLanding = useCallback(() => navigate(LANDING_SCREEN), [navigate]);

  // При смене экрана возвращаемся к началу страницы
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  // Просмотр экрана для статистики посещений (если Метрика включена)
  useEffect(() => {
    trackScreen(activeScreen);
  }, [activeScreen]);

  // Заранее подгружаем приложение, чтобы переход с лендинга был мгновенным
  useEffect(() => {
    whenIdle(() => appModules.forEach((load) => load()));
  }, []);

  // Выбираем, какой экран отрисовать внутри приложения
  const renderAppScreen = () => {
    switch (activeScreen) {
      case 'savings':
        return <SavingsScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'settings':
        return <SettingsScreen params={route.params} onLogout={exitToLanding} />;
      case 'transactions':
        return <TransactionsScreen params={route.params} />;
      default:
        return <DashboardScreen onNavigate={navigate} />;
    }
  };

  return (
    // Общие финансовые данные доступны всем экранам и не сбрасываются при переходах.
    // reducedMotion="user": при системной настройке «уменьшить движение» анимации сдвига отключаются.
    <MotionConfig reducedMotion="user">
      <FinanceProvider>
        <AppActionsProvider onNavigate={navigate}>
          <AnimatePresence mode="wait">
            {isLanding ? (
              <motion.div key="landing" className="min-h-full" {...layoutTransition}>
                <LandingPage onStart={() => navigate('dashboard')} />
              </motion.div>
            ) : (
              <motion.div key="app" className="min-h-full" {...layoutTransition}>
                {/* Пока код приложения не скачался — пустой фон вместо мигания */}
                <Suspense fallback={<div className="min-h-screen bg-surface" />}>
                  <AppShell activeScreen={activeScreen} onNavigate={navigate} onExit={exitToLanding}>
                    <AnimatePresence mode="wait">
                      {/* Новые параметры (другой поиск, другая категория) — тот же экран заново */}
                      <motion.div key={`${activeScreen}:${JSON.stringify(route.params)}`} {...screenTransition}>
                        {/* Пока код экрана скачивается — заглушка вместо пустоты */}
                        <Suspense fallback={<ScreenSkeleton label={APP_SHELL.loading} />}>{renderAppScreen()}</Suspense>
                      </motion.div>
                    </AnimatePresence>
                  </AppShell>
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </AppActionsProvider>
      </FinanceProvider>
    </MotionConfig>
  );
}
