import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import Toast from '../components/ui/Toast.jsx';
import { APP_SHELL } from '../data/mockData.js';

/*
 * Общие действия интерфейса, доступные из любого компонента:
 * - navigate(screen) — переход на экран (с лендинга тоже);
 * - notify(text) — короткое уведомление внизу экрана;
 * - notifySoon() — уведомление «Скоро будет доступно» для ещё не готовых функций.
 * Уведомление одно на всё приложение, поэтому они не накладываются друг на друга.
 */

const AppActionsContext = createContext(null);

export function AppActionsProvider({ onNavigate, children }) {
  // { text, icon } или null
  const [toast, setToast] = useState(null);
  const hideToast = useCallback(() => setToast(null), []);

  const notify = useCallback((text, icon) => setToast({ text, icon }), []);
  const notifySoon = useCallback(() => notify(APP_SHELL.soonMessage, Clock), [notify]);

  const value = useMemo(() => ({ navigate: onNavigate, notify, notifySoon }), [onNavigate, notify, notifySoon]);

  return (
    <AppActionsContext.Provider value={value}>
      {children}
      <Toast message={toast?.text} icon={toast?.icon} onHide={hideToast} />
    </AppActionsContext.Provider>
  );
}

// Хук для доступа к общим действиям интерфейса
export const useAppActions = () => {
  const context = useContext(AppActionsContext);
  if (!context) throw new Error('useAppActions нужно вызывать внутри AppActionsProvider');
  return context;
};
