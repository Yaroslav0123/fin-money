import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppShell from './components/app/AppShell.jsx';
import ScreenSwitcher from './components/layout/ScreenSwitcher.jsx';
import { FinanceProvider } from './context/FinanceContext.jsx';
import AnalyticsScreen from './screens/AnalyticsScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import GoalsScreen from './screens/GoalsScreen.jsx';
import LandingPage from './screens/LandingPage.jsx';
import SavingsScreen from './screens/SavingsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import { SCREENS } from './data/mockData.js';

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
    // Общие финансовые данные доступны всем экранам и не сбрасываются при переходах
    <FinanceProvider>
      <AnimatePresence mode="wait">
        {isLanding ? (
          <motion.div key="landing" className="min-h-full" {...layoutTransition}>
            <LandingPage onStart={() => setActiveScreen('dashboard')} />
            {/* Демо-переключатель экранов плавает внизу страницы */}
            <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center">
              <ScreenSwitcher screens={SCREENS} activeId={activeScreen} onChange={setActiveScreen} />
            </div>
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
    </FinanceProvider>
  );
}
