import { useState } from 'react';
import AddTransactionDialog from './AddTransactionDialog.jsx';
import BottomNav from './BottomNav.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { ADD_TRANSACTION, SCREEN_META } from '../../data/mockData.js';

/**
 * Каркас веб-приложения: боковое меню (десктоп), верхняя панель,
 * область контента и нижняя навигация (мобильные).
 * Здесь же живёт диалог «Добавить операцию» — он открывается
 * и кнопкой в шапке, и круглой «+» в нижней панели.
 * onExit — возврат на лендинг.
 */
export default function AppShell({ activeScreen, onNavigate, onExit, children }) {
  const meta = SCREEN_META[activeScreen];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { notify, notifySoon } = useAppActions();

  const openAdd = () => setIsAddOpen(true);
  const handleAdded = () => {
    setIsAddOpen(false);
    notify(ADD_TRANSACTION.success);
  };

  return (
    <div className="min-h-full bg-surface lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <Sidebar activeScreen={activeScreen} onNavigate={onNavigate} onExit={onExit} />

      <div className="min-w-0 pb-28 lg:pb-12">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onExit={onExit}
          onAdd={openAdd}
          onProfile={() => onNavigate('settings')}
          onSoon={notifySoon}
        />
        <main className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-10 lg:pt-8">{children}</main>
      </div>

      <BottomNav activeScreen={activeScreen} onNavigate={onNavigate} onAdd={openAdd} />

      <AddTransactionDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdded={handleAdded} />
    </div>
  );
}
