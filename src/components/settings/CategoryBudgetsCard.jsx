import { useState } from 'react';
import { Gauge, Pencil, Plus } from 'lucide-react';
import BudgetMeter from '../budgets/BudgetMeter.jsx';
import CategoryBudgetDialog from '../budgets/CategoryBudgetDialog.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { CATEGORY_BUDGETS } from '../../data/mockData.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * Карточка «Бюджеты по категориям» в «Настройках»: месячные лимиты с тратами текущего месяца.
 * Лимит можно задать, изменить и убрать. Лимит удалённой категории удаляется вместе с ней.
 */
export default function CategoryBudgetsCard({ className = '' }) {
  const { budgets, expenseCategories, setCategoryBudget } = useFinance();
  const { notify } = useAppActions();
  const t = CATEGORY_BUDGETS;
  // budget: null — новый лимит, иначе изменение. key — номер открытия: окно монтируется заново каждый раз,
  // иначе в нём осталась бы прошлая категория и сумма. При закрытии меняется только isOpen — окно доигрывает анимацию.
  const [dialog, setDialog] = useState({ budget: null, isOpen: false, key: 0 });
  const openDialog = (budget) => setDialog((prev) => ({ budget, isOpen: true, key: prev.key + 1 }));
  const closeDialog = () => setDialog((prev) => ({ ...prev, isOpen: false }));

  const choices = expenseCategories.filter((c) => !budgets.some((b) => b.id === c.id));

  const handleSave = (categoryId, limit) => {
    setCategoryBudget(categoryId, limit);
    notify(dialog.budget ? t.saved : t.added);
    closeDialog();
  };

  const handleRemove = (categoryId) => {
    setCategoryBudget(categoryId, null);
    notify(t.deleted);
    closeDialog();
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{t.title}</h3>
        <Button
          size="sm"
          pill
          onClick={() => openDialog(null)}
          disabled={choices.length === 0}
          title={choices.length === 0 ? t.allSet : undefined}
          className="h-9 shrink-0 px-4 disabled:opacity-40 disabled:shadow-none"
        >
          <Plus className="h-4 w-4" />
          {t.add}
        </Button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t.description}</p>

      {budgets.length === 0 ? (
        <EmptyState icon={Gauge} text={t.empty} />
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {budgets.map((budget) => (
            <li key={budget.id}>
              <BudgetMeter
                budget={budget}
                actions={
                  <button
                    type="button"
                    aria-label={fillTemplate(t.edit, { name: budget.name })}
                    onClick={() => openDialog(budget)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <CategoryBudgetDialog
        key={dialog.key}
        isOpen={dialog.isOpen}
        budget={dialog.budget}
        choices={choices}
        onClose={closeDialog}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </Card>
  );
}
