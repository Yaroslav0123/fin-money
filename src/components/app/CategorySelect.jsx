import { IMPORT_DIALOG } from '../../data/mockData.js';
import { TRANSFER_CHOICE } from '../../utils/statement.js';

/**
 * Выбор категории для операции из выписки (предпросмотр импорта и разбор «Другого»).
 * incoming — деньги пришли: тогда можно выбрать доход или возврат в категорию расходов;
 * для списания — только расходы. Последний вариант — перевод между своими счетами.
 * value — id категории или 'transfer'; onChange(value).
 */
export default function CategorySelect({ incoming, value, onChange, incomeCategories, expenseCategories, label, disabled = false }) {
  const t = IMPORT_DIALOG;
  const options = (categories) =>
    categories.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ));

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-9 w-full max-w-xs cursor-pointer truncate rounded-full bg-surface px-3 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default"
    >
      {incoming ? (
        <>
          <optgroup label={t.incomeGroup}>{options(incomeCategories)}</optgroup>
          <optgroup label={t.refundGroup}>{options(expenseCategories)}</optgroup>
        </>
      ) : (
        <optgroup label={t.expenseGroup}>{options(expenseCategories)}</optgroup>
      )}
      <option value={TRANSFER_CHOICE}>{t.transferOption}</option>
    </select>
  );
}
