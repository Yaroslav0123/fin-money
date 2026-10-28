import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import CategoryDialog from './CategoryDialog.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import IconTile from '../ui/IconTile.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { fillTemplate } from '../../utils/format.js';

/**
 * Карточка «Категории»: свои категории расходов и доходов.
 * Категорию можно добавить, переименовать, сменить иконку и цвет, удалить —
 * тогда её операции переходят в «Другое» (или первую оставшуюся категорию того же типа).
 * Рядом с названием — сколько операций в категории.
 */
export default function CategoriesCard({ texts, className = '' }) {
  const { categories, rawTransactions, addCategory, updateCategory, deleteCategory } = useFinance();
  const { notify } = useAppActions();
  const [type, setType] = useState(texts.tabs[0].id);
  // null — закрыт, { category: null } — новая, { category } — изменение
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const list = categories.filter((c) => c.type === type);
  const usage = rawTransactions.reduce((counts, tx) => {
    if (tx.categoryId) counts[tx.categoryId] = (counts[tx.categoryId] ?? 0) + 1;
    return counts;
  }, {});
  const canDelete = list.length > 1;

  // Куда уйдут операции удаляемой категории (как в FinanceContext)
  const fallbackName = (category) => {
    const rest = list.filter((c) => c.id !== category.id);
    return (rest.find((c) => c.iconId === 'other') ?? rest[0])?.name;
  };

  const handleSave = (draft) => {
    if (dialog.category) {
      updateCategory(dialog.category.id, draft);
      notify(texts.saved);
    } else {
      addCategory({ ...draft, type });
      notify(texts.added);
    }
    setDialog(null);
  };

  const handleDelete = () => {
    deleteCategory(deleting.id);
    setDeleting(null);
    notify(texts.deleted);
  };

  const iconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl id="categories-type" options={texts.tabs} value={type} onChange={setType} />
          <Button size="sm" pill onClick={() => setDialog({ category: null })} className="h-9 shrink-0 px-4">
            <Plus className="h-4 w-4" />
            {texts.add}
          </Button>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {list.map((category) => (
          <li key={category.id} className="flex items-center gap-3 rounded-2xl py-2">
            <IconTile icon={category.icon} accent={category.accent} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{category.name}</span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink-muted">{usage[category.id] ?? 0}</span>
            <button
              type="button"
              aria-label={fillTemplate(texts.edit, { name: category.name })}
              onClick={() => setDialog({ category })}
              className={iconButtonClass}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={fillTemplate(texts.delete, { name: category.name })}
              title={canDelete ? undefined : texts.lastOne}
              disabled={!canDelete}
              onClick={() => setDeleting(category)}
              className={`${iconButtonClass} hover:bg-negative-bg hover:text-negative`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <CategoryDialog
        key={dialog?.category?.id ?? 'new'}
        isOpen={Boolean(dialog)}
        category={dialog?.category ?? null}
        texts={texts.dialog}
        onClose={() => setDialog(null)}
        onSave={handleSave}
      />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={deleting ? fillTemplate(texts.delete, { name: deleting.name }) : ''}
        text={deleting ? fillTemplate(texts.deleteQuestion, { name: deleting.name, fallback: fallbackName(deleting) }) : ''}
        confirmLabel={texts.deleteConfirm}
        cancelLabel={texts.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}
