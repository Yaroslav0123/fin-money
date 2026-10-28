import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ADD_TRANSACTION, AMOUNT_LIMIT } from '../../data/mockData.js';
import { ACCENTS } from '../../theme/accents.js';
import { fromDateInputValue, toDateInputValue } from '../../utils/dates.js';
import {
  currencyQuickAmounts,
  currencySymbol,
  formatDisplayMoney,
  formatMoney,
  fromDisplayAmount,
  toDisplayAmount,
} from '../../utils/format.js';

const DEFAULT_TYPE = 'expense';
const DISPLAY_PRECISION = 100;

// Начальные значения формы: пустые для новой операции или из редактируемой
const initialForm = (transaction, categoriesByType) => {
  if (!transaction) {
    return { type: DEFAULT_TYPE, rawAmount: '', categoryId: categoriesByType[DEFAULT_TYPE][0]?.id, comment: '', date: toDateInputValue(new Date()) };
  }
  const display = Math.round(toDisplayAmount(Math.abs(transaction.amount)) * DISPLAY_PRECISION) / DISPLAY_PRECISION;
  return {
    type: transaction.type,
    rawAmount: String(display),
    categoryId: transaction.categoryId,
    comment: transaction.comment ?? '',
    date: toDateInputValue(new Date(transaction.date)),
  };
};

/**
 * Диалог операции: добавление новой или изменение существующей (transaction).
 * Тип (расход / доход), сумма в валюте отображения, категория, дата и комментарий.
 * У существующей операции есть удаление с подтверждением.
 * onDone(message) — операция сохранена или удалена (текст для уведомления).
 * Компонент монтируется заново для каждой операции (key у родителя), поэтому форма
 * сразу заполнена её значениями.
 */
export default function TransactionDialog({ isOpen, transaction = null, onClose, onDone }) {
  const { addTransaction, updateTransaction, deleteTransaction, expenseCategories, incomeCategories } = useFinance();
  const categoriesByType = { expense: expenseCategories, income: incomeCategories };
  const [form, setForm] = useState(() => initialForm(transaction, categoriesByType));
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isEdit = Boolean(transaction);
  const t = ADD_TRANSACTION;

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const categories = categoriesByType[form.type];
  const amount = fromDisplayAmount(Number(form.rawAmount) || 0);
  const isTooMuch = amount > AMOUNT_LIMIT.max;
  const today = toDateInputValue(new Date());
  const isFuture = form.date > today;
  const canSubmit = amount > 0 && !isTooMuch && !isFuture && Boolean(form.date) && Boolean(form.categoryId);

  const reset = () => {
    setForm(initialForm(null, categoriesByType));
    setIsConfirmingDelete(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // При смене типа выбираем первую категорию нового списка
  const handleTypeChange = (type) => set({ type, categoryId: categoriesByType[type][0]?.id });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Для сегодняшней даты сохраняем текущее время, для прошлой — время исходной операции или полдень
    const timeSource = form.date === today ? new Date() : transaction ? new Date(transaction.date) : new Date(new Date().setHours(12, 0));
    const draft = {
      type: form.type,
      amount,
      categoryId: form.categoryId,
      comment: form.comment.trim(),
      date: fromDateInputValue(form.date, timeSource),
    };
    if (isEdit) updateTransaction(transaction.id, draft);
    else addTransaction(draft);
    reset();
    onDone(isEdit ? t.saved : t.success);
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    reset();
    onDone(t.deleted);
  };

  const inputClass =
    'h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:border-brand focus:bg-white focus:outline-none';

  return (
    <Modal isOpen={isOpen} title={isEdit ? t.editTitle : t.title} onClose={handleClose} closeLabel={t.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <SegmentedControl
          id="add-tx-type"
          options={t.types}
          value={form.type}
          onChange={handleTypeChange}
          className="flex w-full [&>button]:flex-1"
        />

        {/* Сумма: у дохода зелёный знак «+», у расхода — «−» */}
        <div>
          <label htmlFor="add-tx-amount" className="text-xs font-medium text-ink-muted">
            {t.amountLabel}
          </label>
          <div
            className={`mt-2 flex items-center rounded-2xl border-2 bg-surface px-4 transition-colors duration-200 focus-within:bg-white ${
              isTooMuch ? 'border-negative' : 'border-transparent focus-within:border-brand'
            }`}
          >
            <span className={`mr-1 text-2xl font-bold ${form.type === 'income' ? 'text-positive' : 'text-ink-muted'}`}>
              {form.type === 'income' ? '+' : '−'}
            </span>
            <input
              id="add-tx-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              autoFocus
              value={form.rawAmount}
              onChange={(e) => set({ rawAmount: e.target.value })}
              placeholder="0"
              className="no-spinner h-14 w-full bg-transparent text-2xl font-bold text-ink placeholder:text-ink-muted/50 focus:outline-none"
            />
            <span className="text-2xl font-bold text-ink-muted">{currencySymbol()}</span>
          </div>
          {isTooMuch && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {AMOUNT_LIMIT.error} — {formatMoney(AMOUNT_LIMIT.max)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {currencyQuickAmounts().map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => set({ rawAmount: String(value) })}
                className="rounded-full bg-brand-light px-4 py-2 text-xs font-semibold text-brand transition-colors duration-200 hover:bg-brand-soft"
              >
                {formatDisplayMoney(value)}
              </button>
            ))}
          </div>
        </div>

        {/* Выбор категории */}
        <div>
          <p className="text-xs font-medium text-ink-muted">{t.categoryLabel}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = category.id === form.categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => set({ categoryId: category.id })}
                  aria-pressed={isActive}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-[11px] font-semibold transition-colors duration-200 ${
                    isActive ? 'border-brand bg-brand-light/60 text-ink' : 'border-transparent bg-surface text-ink-secondary hover:bg-brand-light/40'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${ACCENTS[category.accent].tile}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="w-full truncate text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div>
            <label htmlFor="add-tx-date" className="text-xs font-medium text-ink-muted">
              {t.dateLabel}
            </label>
            <input
              id="add-tx-date"
              type="date"
              max={today}
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              aria-invalid={isFuture}
              className={`mt-2 ${inputClass} ${isFuture ? 'border-negative' : ''}`}
            />
          </div>
          <div>
            <label htmlFor="add-tx-comment" className="text-xs font-medium text-ink-muted">
              {t.commentLabel}
            </label>
            <input
              id="add-tx-comment"
              value={form.comment}
              onChange={(e) => set({ comment: e.target.value })}
              placeholder={t.commentPlaceholder}
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>
        {isFuture && (
          <p className="-mt-3 text-xs text-negative" role="alert">
            {t.futureDate}
          </p>
        )}

        {/* Подтверждение удаления заменяет кнопки внизу */}
        {isConfirmingDelete ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-negative-bg px-4 py-3" role="group" aria-label={t.deleteQuestion}>
            <span className="text-sm font-semibold text-negative">{t.deleteQuestion}</span>
            <div className="flex gap-2">
              <Button size="sm" pill variant="secondary" onClick={() => setIsConfirmingDelete(false)}>
                {t.cancel}
              </Button>
              <Button size="sm" pill className="bg-negative shadow-none hover:bg-negative/90" onClick={handleDelete}>
                {t.delete}
              </Button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-3 pt-1 ${isEdit ? 'grid-cols-[auto_1fr_1fr]' : 'grid-cols-2'}`}>
            {isEdit && (
              <Button
                variant="secondary"
                size="md"
                aria-label={t.delete}
                onClick={() => setIsConfirmingDelete(true)}
                className="bg-negative-bg px-4 text-negative hover:bg-negative/15"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={handleClose}>
              {t.cancel}
            </Button>
            <Button type="submit" size="md" disabled={!canSubmit} className="disabled:opacity-40 disabled:shadow-none">
              {isEdit ? t.save : t.confirm}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
