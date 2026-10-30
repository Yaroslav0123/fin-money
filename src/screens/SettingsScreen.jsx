import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AccountsCard from '../components/settings/AccountsCard.jsx';
import BudgetCard from '../components/settings/BudgetCard.jsx';
import CategoriesCard from '../components/settings/CategoriesCard.jsx';
import CategoryBudgetsCard from '../components/settings/CategoryBudgetsCard.jsx';
import CategoryRulesCard from '../components/settings/CategoryRulesCard.jsx';
import DemoDataCard from '../components/settings/DemoDataCard.jsx';
import ImportsCard from '../components/settings/ImportsCard.jsx';
import PreferencesCard from '../components/settings/PreferencesCard.jsx';
import ProfileCard from '../components/settings/ProfileCard.jsx';
import SecurityCard from '../components/settings/SecurityCard.jsx';
import ToggleListCard from '../components/settings/ToggleListCard.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { SETTINGS_PAGE } from '../data/mockData.js';
import { monthName } from '../utils/dates.js';

// Раздел, если его не передали при переходе (первый в списке)
const DEFAULT_SECTION = SETTINGS_PAGE.sections.items[0].id;

/**
 * Экран «Настройки» (веб-версия). Карточки разложены по разделам-вкладкам:
 * «Деньги» — бюджет, лимиты категорий, счета, категории и правила; «Данные» — история импорта и демо-данные;
 * «Профиль» — личные данные и безопасность; «Приложение» — параметры и уведомления.
 * params.section — какой раздел открыть (профиль в шапке ведёт в «Профиль», лимиты на «Главной» — в «Деньги»).
 * onLogout — «выход из аккаунта» (в прототипе возвращает на лендинг).
 * Параметры, бюджет, лимиты категорий и «Скрывать баланс» хранятся в общем состоянии и действуют на всех экранах.
 */
export default function SettingsScreen({ params = {}, onLogout }) {
  const {
    summary,
    settings,
    setSetting,
    hideBalance,
    setHideBalance,
    resetDemo,
    startFromScratch,
    today,
    imports,
    undoImport,
    categoryRules,
    deleteCategoryRule,
  } = useFinance();
  const { notify, openAbout, openImport } = useAppActions();
  const { demo, sections } = SETTINGS_PAGE;
  const [section, setSection] = useState(sections.items.some((s) => s.id === params.section) ? params.section : DEFAULT_SECTION);
  const current = sections.items.find((s) => s.id === section);

  // Повторный переход с тем же разделом (профиль в шапке, когда открыта другая вкладка) экран не пересоздаёт —
  // раздел переключаем сами. params — новый объект при каждом переходе.
  useEffect(() => {
    if (sections.items.some((s) => s.id === params.section)) setSection(params.section);
  }, [params, sections.items]);

  // Содержимое разделов
  const panels = {
    money: (
      <>
        <Reveal className="xl:col-span-2">
          <CategoryBudgetsCard className="h-full" />
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
        <Reveal delay={0.1} className="xl:col-span-2">
          <AccountsCard texts={SETTINGS_PAGE.accounts} className="h-full" />
        </Reveal>
        <Reveal delay={0.15}>
          <CategoryRulesCard
            texts={SETTINGS_PAGE.rules}
            rules={categoryRules}
            onDelete={(key) => {
              deleteCategoryRule(key);
              notify(SETTINGS_PAGE.rules.deleted);
            }}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.1} className="xl:col-span-3">
          <CategoriesCard texts={SETTINGS_PAGE.categories} />
        </Reveal>
      </>
    ),
    data: (
      <>
        <Reveal className="xl:col-span-2">
          <ImportsCard
            texts={SETTINGS_PAGE.imports}
            imports={imports}
            onUndo={(id) => {
              undoImport(id);
              notify(SETTINGS_PAGE.imports.undone);
            }}
            onUpload={() => openImport()}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.05}>
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
      </>
    ),
    profile: (
      <>
        <Reveal className="xl:col-span-2">
          <ProfileCard texts={SETTINGS_PAGE.profile} onSave={() => notify(SETTINGS_PAGE.saved)} />
        </Reveal>
        <Reveal delay={0.05}>
          <SecurityCard
            texts={SETTINGS_PAGE.security}
            controlled={{ hideBalance: { checked: hideBalance, onChange: setHideBalance } }}
            onLogout={onLogout}
            className="h-full"
          />
        </Reveal>
      </>
    ),
    app: (
      <>
        <Reveal className="xl:col-span-2">
          <PreferencesCard texts={SETTINGS_PAGE.preferences} values={settings} onChange={setSetting} className="h-full" />
        </Reveal>
        <Reveal delay={0.05}>
          <ToggleListCard title={SETTINGS_PAGE.notifications.title} items={SETTINGS_PAGE.notifications.items} className="h-full" />
        </Reveal>
      </>
    ),
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <Reveal className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Tabs id="settings" label={sections.label} tabs={sections.items} value={section} onChange={setSection} className="self-start" />
        <p className="px-2 text-xs text-ink-muted">{current.hint}</p>
      </Reveal>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={section}
          id="settings-panel"
          role="tabpanel"
          aria-labelledby={`settings-tab-${section}`}
          className="grid grid-cols-1 gap-5 xl:grid-cols-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {panels[section]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
