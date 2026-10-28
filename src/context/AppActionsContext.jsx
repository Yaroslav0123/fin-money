import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AboutDialog from '../components/app/AboutDialog.jsx';
import TransactionDialog from '../components/app/TransactionDialog.jsx';
import TransferDialog from '../components/app/TransferDialog.jsx';
import Toast from '../components/ui/Toast.jsx';

/*
 * Общие действия интерфейса, доступные из любого компонента:
 * - navigate(screen, params) — переход на экран (с лендинга тоже), params — например { query };
 * - notify(text) — короткое уведомление внизу экрана;
 * - openAddTransaction() — диалог новой операции;
 * - openTransaction(tx) — операция из списка: доход и расход открываются на редактирование,
 *   перевод — карточкой с возможностью удаления;
 * - openAbout(sectionId) — окно «О проекте».
 * Диалоги и уведомление по одному на всё приложение, поэтому они не накладываются друг на друга.
 */

const AppActionsContext = createContext(null);

export function AppActionsProvider({ onNavigate, children }) {
  // { text, icon } или null
  const [toast, setToast] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aboutSection, setAboutSection] = useState(null);

  const hideToast = useCallback(() => setToast(null), []);
  const notify = useCallback((text, icon) => setToast({ text, icon }), []);
  const openAddTransaction = useCallback(() => setIsAddOpen(true), []);
  const openTransaction = useCallback((tx) => setEditing(tx), []);
  const openAbout = useCallback((sectionId) => setAboutSection(sectionId), []);

  // Диалог закрылся после сохранения или удаления — показываем, что получилось
  const handleDone = useCallback(
    (message) => {
      setIsAddOpen(false);
      setEditing(null);
      notify(message);
    },
    [notify],
  );

  const value = useMemo(
    () => ({ navigate: onNavigate, notify, openAddTransaction, openTransaction, openAbout }),
    [onNavigate, notify, openAddTransaction, openTransaction, openAbout],
  );

  const isEditingTransfer = editing?.type === 'transfer';

  return (
    <AppActionsContext.Provider value={value}>
      {children}
      <TransactionDialog key="add" isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onDone={handleDone} />
      {/* Для каждой операции свой экземпляр: форма сразу заполнена её значениями */}
      {editing && !isEditingTransfer && (
        <TransactionDialog key={editing.id} isOpen transaction={editing} onClose={() => setEditing(null)} onDone={handleDone} />
      )}
      <TransferDialog transaction={isEditingTransfer ? editing : null} onClose={() => setEditing(null)} onDone={handleDone} />
      <AboutDialog sectionId={aboutSection} onClose={() => setAboutSection(null)} />
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
