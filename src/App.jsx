import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import AppShell from './components/app/AppShell.jsx';
import { AppActionsProvider } from './context/AppActionsContext.jsx';
import { FinanceProvider } from './context/FinanceContext.jsx';
import AnalyticsScreen from './screens/AnalyticsScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import GoalsScreen from './screens/GoalsScreen.jsx';
import LandingPage from './screens/LandingPage.jsx';
import SavingsScreen from './screens/SavingsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import TransactionsScreen from './screens/TransactionsScreen.jsx';

// Экран-лендинг (сайт). Остальные экраны живут внутри каркаса веб-приложения.
const LANDING_SCREEN = 'onboarding';

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
        return <SettingsScreen onLogout={exitToLanding} />;
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
                <AppShell activeScreen={activeScreen} onNavigate={navigate} onExit={exitToLanding}>
                  <AnimatePresence mode="wait">
                    {/* Новые параметры (другой поиск, другая категория) — тот же экран заново */}
                    <motion.div key={`${activeScreen}:${JSON.stringify(route.params)}`} {...screenTransition}>
                      {renderAppScreen()}
                    </motion.div>
                  </AnimatePresence>
                </AppShell>
              </motion.div>
            )}
          </AnimatePresence>
        </AppActionsProvider>
      </FinanceProvider>
    </MotionConfig>
  );
}
