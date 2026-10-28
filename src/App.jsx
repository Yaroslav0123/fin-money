import { useEffect, useState } from 'react';
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
  const [activeScreen, setActiveScreen] = useState(LANDING_SCREEN);
  const isLanding = activeScreen === LANDING_SCREEN;

  // При смене экрана возвращаемся к началу страницы
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeScreen]);

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
        return <SettingsScreen onLogout={() => setActiveScreen(LANDING_SCREEN)} />;
      default:
        return <DashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    // Общие финансовые данные доступны всем экранам и не сбрасываются при переходах.
    // reducedMotion="user": при системной настройке «уменьшить движение» анимации сдвига отключаются.
    <MotionConfig reducedMotion="user">
      <FinanceProvider>
        <AppActionsProvider onNavigate={setActiveScreen}>
          <AnimatePresence mode="wait">
            {isLanding ? (
              <motion.div key="landing" className="min-h-full" {...layoutTransition}>
                <LandingPage onStart={() => setActiveScreen('dashboard')} />
              </motion.div>
            ) : (
              <motion.div key="app" className="min-h-full" {...layoutTransition}>
                <AppShell
                  activeScreen={activeScreen}
                  onNavigate={setActiveScreen}
                  onExit={() => setActiveScreen(LANDING_SCREEN)}
                >
                  <AnimatePresence mode="wait">
                    <motion.div key={activeScreen} {...screenTransition}>
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
