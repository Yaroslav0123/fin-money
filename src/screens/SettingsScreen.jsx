import BudgetCard from '../components/settings/BudgetCard.jsx';
import CategoriesCard from '../components/settings/CategoriesCard.jsx';
import DemoDataCard from '../components/settings/DemoDataCard.jsx';
import PreferencesCard from '../components/settings/PreferencesCard.jsx';
import ProfileCard from '../components/settings/ProfileCard.jsx';
import SecurityCard from '../components/settings/SecurityCard.jsx';
import ToggleListCard from '../components/settings/ToggleListCard.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { SETTINGS_PAGE } from '../data/mockData.js';
import { monthName } from '../utils/dates.js';

/**
 * Экран «Настройки» (веб-версия).
 * onLogout — «выход из аккаунта» (в прототипе возвращает на лендинг).
 * Параметры, бюджет и «Скрывать баланс» хранятся в общем состоянии и действуют на всех экранах.
 * Категории можно добавлять, менять и удалять. Внизу — управление данными в браузере.
 */
export default function SettingsScreen({ onLogout }) {
  const { summary, settings, setSetting, hideBalance, setHideBalance, resetDemo, startFromScratch, today } = useFinance();
  const { notify, openAbout } = useAppActions();
  const { demo } = SETTINGS_PAGE;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Reveal className="xl:col-span-2">
        <ProfileCard texts={SETTINGS_PAGE.profile} onSave={() => notify(SETTINGS_PAGE.saved)} />
      </Reveal>
      <Reveal delay={0.05}>
        <BudgetCard
          spent={summary.expenses.amount}
          limit={settings.budgetLimit}
          month={monthName(today)}
          texts={SETTINGS_PAGE.budget}
          onLimitChange={(value) => setSetting('budgetLimit', value)}
          className="h-full"
        />
      </Reveal>

      <Reveal delay={0.1}>
        <ToggleListCard title={SETTINGS_PAGE.notifications.title} items={SETTINGS_PAGE.notifications.items} className="h-full" />
      </Reveal>
      <Reveal delay={0.15}>
        <PreferencesCard texts={SETTINGS_PAGE.preferences} values={settings} onChange={setSetting} className="h-full" />
      </Reveal>
      <Reveal delay={0.2}>
        <SecurityCard
          texts={SETTINGS_PAGE.security}
          controlled={{ hideBalance: { checked: hideBalance, onChange: setHideBalance } }}
          onLogout={onLogout}
          className="h-full"
        />
      </Reveal>

      <Reveal delay={0.1} className="xl:col-span-2">
        <CategoriesCard texts={SETTINGS_PAGE.categories} className="h-full" />
      </Reveal>
      <Reveal delay={0.15}>
        <DemoDataCard
          texts={demo}
          onReset={() => {
            resetDemo();
            notify(demo.done);
          }}
          onClear={() => {
            startFromScratch();
            notify(demo.emptyDone);
          }}
          onAbout={() => openAbout('about')}
          className="h-full"
        />
      </Reveal>
    </div>
  );
}
