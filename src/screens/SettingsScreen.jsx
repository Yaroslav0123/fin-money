import BudgetCard from '../components/settings/BudgetCard.jsx';
import PreferencesCard from '../components/settings/PreferencesCard.jsx';
import ProfileCard from '../components/settings/ProfileCard.jsx';
import SecurityCard from '../components/settings/SecurityCard.jsx';
import ToggleListCard from '../components/settings/ToggleListCard.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { SETTINGS_PAGE } from '../data/mockData.js';

/**
 * Экран «Настройки» (веб-версия).
 * onLogout — «выход из аккаунта» (в прототипе возвращает на лендинг).
 * Бюджет считает актуальные расходы, а «Скрывать баланс» хранится в общем состоянии
 * и действует на «Главной».
 */
export default function SettingsScreen({ onLogout }) {
  const { summary, hideBalance, setHideBalance } = useFinance();
  const { notify, notifySoon } = useAppActions();

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Reveal className="xl:col-span-2">
          <ProfileCard texts={SETTINGS_PAGE.profile} onSave={() => notify(SETTINGS_PAGE.saved)} />
        </Reveal>
        <Reveal delay={0.05}>
          <BudgetCard spent={summary.expenses.amount} texts={SETTINGS_PAGE.budget} className="h-full" />
        </Reveal>

        <Reveal delay={0.1}>
          <ToggleListCard
            title={SETTINGS_PAGE.notifications.title}
            items={SETTINGS_PAGE.notifications.items}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <PreferencesCard texts={SETTINGS_PAGE.preferences} className="h-full" />
        </Reveal>
        <Reveal delay={0.2}>
          <SecurityCard
            texts={SETTINGS_PAGE.security}
            controlled={{ hideBalance: { checked: hideBalance, onChange: setHideBalance } }}
            onLogout={onLogout}
            onLinkClick={notifySoon}
            className="h-full"
          />
        </Reveal>
      </div>
    </>
  );
}
