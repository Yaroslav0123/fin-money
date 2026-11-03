import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useRef, useState } from 'react';
import AboutDialog from '../components/app/AboutDialog.jsx';
import TransactionDialog from '../components/app/TransactionDialog.jsx';
import TransferDialog from '../components/app/TransferDialog.jsx';
import Toast from '../components/ui/Toast.jsx';
import { IMPORT_DIALOG } from '../data/mockData.js';
import { fillTemplate } from '../utils/format.js';

// Окно импорта со всем разбором выписок скачивается, только когда его впервые открыли. Так же — итоги месяца и достижения.
const ImportDialog = lazy(() => import('../components/app/ImportDialog.jsx'));
const MonthRecap = lazy(() => import('../components/recap/MonthRecap.jsx'));
const AchievementsDialog = lazy(() => import('../components/achievements/AchievementsDialog.jsx'));

/*
 * Общие действия интерфейса, доступные из любого компонента:
 * - navigate(screen, params) — переход на экран (с лендинга тоже), params — например { query };
 * - notify(text, icon, { whenFree }) — короткое уведомление внизу экрана; whenFree — не перебивать текущее,
 *   а показать следом (так сообщение о достижении не закрывает сообщение о самом действии);
 * - openAddTransaction() — диалог новой операции;
 * - openTransaction(tx) — операция из списка: доход и расход открываются на редактирование,
 *   перевод — карточкой с возможностью удаления;
 * - openAbout(sectionId) — окно «О проекте»;
 * - openImport(source) — загрузка выписки; source — уже выбранный файл или функция, которая его загрузит
 *   (пример выписки), без source окно начинается с выбора файла;
 * - openRecap() — «Итоги месяца» в виде историй; openAchievements() — окно достижений.
 * Диалоги и уведомление по одному на всё приложение, поэтому они не накладываются друг на друга.
 */

const AppActionsContext = createContext(null);

export function AppActionsProvider({ onNavigate, children }) {
  // { text, icon } или null
  const [toast, setToast] = useState(null);
  // Текущее уведомление и те, что ждут, пока оно скроется (refs: нужны сразу, без ожидания отрисовки)
  const toastRef = useRef(null);
  const queueRef = useRef([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aboutSection, setAboutSection] = useState(null);
  // key — номер открытия: окно импорта каждый раз монтируется заново, с чистым состоянием.
  // При закрытии меняется только isOpen — окно доигрывает анимацию.
  const [importState, setImportState] = useState({ isOpen: false, source: null, key: 0 });
  // Окна, которые скачиваются при первом открытии: были ли открыты (чтобы смонтировать) и открыты ли сейчас.
  // Итоги каждый раз монтируются заново (key — номер открытия) и начинаются с первой карточки.
  const [recap, setRecap] = useState({ isOpen: false, mounted: false, key: 0 });
  const [achievements, setAchievements] = useState({ isOpen: false, mounted: false });

  const showToast = useCallback((item) => {
    toastRef.current = item;
    setToast(item);
  }, []);
  const hideToast = useCallback(() => showToast(queueRef.current.shift() ?? null), [showToast]);
  const notify = useCallback(
    (text, icon, { whenFree = false } = {}) => {
      if (whenFree && toastRef.current) queueRef.current.push({ text, icon });
      else showToast({ text, icon });
    },
    [showToast],
  );
  const openAddTransaction = useCallback(() => setIsAddOpen(true), []);
  const openTransaction = useCallback((tx) => setEditing(tx), []);
  const openAbout = useCallback((sectionId) => setAboutSection(sectionId), []);
  const openImport = useCallback((source = null) => setImportState((prev) => ({ isOpen: true, source, key: prev.key + 1 })), []);
  const closeImport = useCallback(() => setImportState((prev) => ({ ...prev, isOpen: false })), []);
  const handleImported = useCallback((count) => notify(fillTemplate(IMPORT_DIALOG.done, { count })), [notify]);
  const openRecap = useCallback(() => setRecap((prev) => ({ isOpen: true, mounted: true, key: prev.key + 1 })), []);
  const closeRecap = useCallback(() => setRecap((prev) => ({ ...prev, isOpen: false })), []);
  const openAchievements = useCallback(() => setAchievements({ isOpen: true, mounted: true }), []);
  const closeAchievements = useCallback(() => setAchievements((prev) => ({ ...prev, isOpen: false })), []);

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
    () => ({ navigate: onNavigate, notify, openAddTransaction, openTransaction, openAbout, openImport, openRecap, openAchievements }),
    [onNavigate, notify, openAddTransaction, openTransaction, openAbout, openImport, openRecap, openAchievements],
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
      {recap.mounted && (
        <Suspense fallback={null}>
          <MonthRecap
            key={recap.key}
            isOpen={recap.isOpen}
            onClose={closeRecap}
            onAnalytics={() => {
              closeRecap();
              onNavigate('analytics');
            }}
          />
        </Suspense>
      )}
      {achievements.mounted && (
        <Suspense fallback={null}>
          <AchievementsDialog isOpen={achievements.isOpen} onClose={closeAchievements} />
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
