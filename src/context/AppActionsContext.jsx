import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from 'react';
import AboutDialog from '../components/app/AboutDialog.jsx';
import TransactionDialog from '../components/app/TransactionDialog.jsx';
import TransferDialog from '../components/app/TransferDialog.jsx';
import Toast from '../components/ui/Toast.jsx';
import { IMPORT_DIALOG } from '../data/mockData.js';
import { fillTemplate } from '../utils/format.js';

// Окно импорта со всем разбором выписок скачивается, только когда его впервые открыли
const ImportDialog = lazy(() => import('../components/app/ImportDialog.jsx'));

/*
 * Общие действия интерфейса, доступные из любого компонента:
 * - navigate(screen, params) — переход на экран (с лендинга тоже), params — например { query };
 * - notify(text) — короткое уведомление внизу экрана;
 * - openAddTransaction() — диалог новой операции;
 * - openTransaction(tx) — операция из списка: доход и расход открываются на редактирование,
 *   перевод — карточкой с возможностью удаления;
 * - openAbout(sectionId) — окно «О проекте»;
 * - openImport(source) — загрузка выписки; source — уже выбранный файл или функция, которая его загрузит
 *   (пример выписки), без source окно начинается с выбора файла.
 * Диалоги и уведомление по одному на всё приложение, поэтому они не накладываются друг на друга.
 */

const AppActionsContext = createContext(null);

export function AppActionsProvider({ onNavigate, children }) {
  // { text, icon } или null
  const [toast, setToast] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aboutSection, setAboutSection] = useState(null);
  // key — номер открытия: окно импорта каждый раз монтируется заново, с чистым состоянием.
  // При закрытии меняется только isOpen — окно доигрывает анимацию.
  const [importState, setImportState] = useState({ isOpen: false, source: null, key: 0 });

  const hideToast = useCallback(() => setToast(null), []);
  const notify = useCallback((text, icon) => setToast({ text, icon }), []);
  const openAddTransaction = useCallback(() => setIsAddOpen(true), []);
  const openTransaction = useCallback((tx) => setEditing(tx), []);
  const openAbout = useCallback((sectionId) => setAboutSection(sectionId), []);
  const openImport = useCallback((source = null) => setImportState((prev) => ({ isOpen: true, source, key: prev.key + 1 })), []);
  const closeImport = useCallback(() => setImportState((prev) => ({ ...prev, isOpen: false })), []);
  const handleImported = useCallback((count) => notify(fillTemplate(IMPORT_DIALOG.done, { count })), [notify]);

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
    () => ({ navigate: onNavigate, notify, openAddTransaction, openTransaction, openAbout, openImport }),
    [onNavigate, notify, openAddTransaction, openTransaction, openAbout, openImport],
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
      {importState.key > 0 && (
        <Suspense fallback={null}>
          <ImportDialog
            key={importState.key}
            isOpen={importState.isOpen}
            source={importState.source}
            onClose={closeImport}
            onImported={handleImported}
          />
        </Suspense>
      )}
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
