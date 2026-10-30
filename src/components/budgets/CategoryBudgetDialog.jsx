import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { CATEGORY_BUDGETS } from '../../data/mockData.js';
import { parseAmount } from '../../utils/csv.js';
import { averageMonthlySpend } from '../../utils/finance.js';
import { currencySymbol, fillTemplate, formatMoney, fromDisplayAmount, toDisplayAmount } from '../../utils/format.js';

// Копейки → текст поля в валюте отображения, без копеек: лимит — круглая сумма
const toFieldValue = (kopecks) => String(Math.round(toDisplayAmount(kopecks)));

/**
 * Диалог месячного лимита категории расходов.
 * budget — изменяемый лимит ({ id, name, limit }) или null для нового; тогда категорию выбирают
 * из choices (категории расходов без лимита). Подсказка — средние траты категории за 3 месяца.
 * onSave(categoryId, limit в копейках), onRemove(categoryId). Монтируется заново для каждого лимита (key у родителя).
 */
export default function CategoryBudgetDialog({ isOpen, budget = null, choices, onClose, onSave, onRemove }) {
  const { rawTransactions, today } = useFinance();
  const t = CATEGORY_BUDGETS.dialog;
  const [categoryId, setCategoryId] = useState(budget?.id ?? choices[0]?.id ?? '');
  const [rawAmount, setRawAmount] = useState(budget ? toFieldValue(budget.limit) : '');

  const amount = rawAmount.trim() ? parseAmount(rawAmount) : null;
  const isAmountValid = amount !== null && amount > 0;
  const canSave = Boolean(categoryId) && isAmountValid;
  const average = categoryId ? averageMonthlySpend(rawTransactions, categoryId, today) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSave) onSave(categoryId, fromDisplayAmount(amount));
  };

  const fieldClass =
    'mt-2 h-12 w-full rounded-2xl border-2 bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:bg-card focus:outline-none';
  const showError = rawAmount.trim() !== '' && !isAmountValid;

  return (
    <Modal isOpen={isOpen} title={budget ? t.editTitle : t.addTitle} onClose={onClose} closeLabel={t.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="budget-category" className="text-xs font-medium text-ink-muted">
            {t.categoryLabel}
          </label>
          {budget ? (
            <p id="budget-category" className="mt-2 text-sm font-semibold text-ink">
              {budget.name}
            </p>
          ) : (
            <select
              id="budget-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${fieldClass} cursor-pointer border-transparent focus:border-brand`}
            >
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="budget-amount" className="text-xs font-medium text-ink-muted">
            {t.amountLabel}, {currencySymbol()}
          </label>
          <input
            id="budget-amount"
            autoFocus
            inputMode="decimal"
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            placeholder="10000"
            aria-invalid={showError}
            aria-describedby="budget-amount-hint"
            className={`${fieldClass} ${showError ? 'border-negative' : 'border-transparent focus:border-brand'}`}
          />
          <div id="budget-amount-hint" className="mt-2 text-xs" role={showError ? 'alert' : undefined}>
            {showError ? (
              <p className="text-negative">{t.amountError}</p>
            ) : average > 0 ? (
              <p className="flex flex-wrap items-center gap-x-2 text-ink-muted">
                {fillTemplate(t.average, { amount: formatMoney(average) })}
                <button
                  type="button"
                  onClick={() => setRawAmount(toFieldValue(average))}
                  className="font-semibold text-brand hover:underline"
                >
                  {t.useAverage}
                </button>
              </p>
            ) : (
              <p className="text-ink-muted">{t.noHistory}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="md" onClick={budget ? () => onRemove(budget.id) : onClose}>
            {budget ? t.remove : t.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canSave} className="disabled:opacity-40 disabled:shadow-none">
            {budget ? t.save : t.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
