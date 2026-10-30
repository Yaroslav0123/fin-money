import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { SORT_OTHER_DIALOG } from '../../data/mockData.js';
import { fillTemplate, formatSignedMoney, plural } from '../../utils/format.js';
import { withImportCategories } from '../../utils/statement.js';
import CategorySelect from './CategorySelect.jsx';

/**
 * «Разобрать „Другое“»: импортированные операции без категории, сгруппированные по магазину.
 * Категория выбирается сразу для группы и запоминается правилом для следующих выписок.
 * groups — из uncategorizedGroups; onDone(count) — сколько операций получили категорию.
 */
export default function SortOtherDialog({ isOpen, groups, onClose, onDone }) {
  const { categories, recategorize } = useFinance();
  // Выбор по группам: { [groupId]: value }
  const [choices, setChoices] = useState({});
  const t = SORT_OTHER_DIALOG;

  const importCategories = withImportCategories(categories);
  const incomeCategories = importCategories.filter((c) => c.type === 'income');
  const expenseCategories = importCategories.filter((c) => c.type === 'expense');

  const changed = groups.filter((group) => choices[group.id] && choices[group.id] !== group.value);
  const changedCount = changed.reduce((sum, group) => sum + group.ids.length, 0);

  const handleClose = () => {
    setChoices({});
    onClose();
  };

  const handleSave = () => {
    recategorize(
      changed.map((group) => ({ ids: group.ids, value: choices[group.id] })),
      changed.filter((group) => group.key).map((group) => ({ key: group.key, value: choices[group.id], label: group.label })),
    );
    setChoices({});
    onDone(changedCount);
  };

  return (
    <Modal isOpen={isOpen} title={t.title} onClose={handleClose} closeLabel={t.cancel} size="lg">
      <p className="text-sm leading-relaxed text-ink-secondary">{t.hint}</p>
      {groups.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface px-4 py-6 text-center text-sm text-ink-muted">{t.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {groups.map((group) => (
            <li key={group.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{group.label || t.noDescription}</p>
                <p className="text-xs text-ink-muted">
                  {group.ids.length} {plural(group.ids.length, t.count)} · {formatSignedMoney(group.total)}
                </p>
              </div>
              <div className="sm:w-56">
                <CategorySelect
                  incoming={group.incoming}
                  value={choices[group.id] ?? group.value}
                  onChange={(value) => setChoices((prev) => ({ ...prev, [group.id]: value }))}
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  label={fillTemplate(t.categoryLabel, { name: group.label || t.noDescription })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" onClick={handleClose}>
          {t.cancel}
        </Button>
        <Button size="md" disabled={changedCount === 0} onClick={handleSave} className="disabled:opacity-40 disabled:shadow-none">
          {t.save}
        </Button>
      </div>
    </Modal>
  );
}
