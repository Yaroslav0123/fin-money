import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ADD_TRANSACTION, AMOUNT_LIMIT, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/mockData.js';
import { ACCENTS } from '../../theme/accents.js';
import { formatMoney } from '../../utils/format.js';

const DEFAULT_TYPE = 'expense';
const CATEGORIES_BY_TYPE = { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES };

/**
 * Диалог добавления операции: тип (расход / доход), сумма, категория, комментарий.
 * Операция сохраняется в общем состоянии (FinanceContext) и сразу видна на «Главной».
 * onAdded — вызывается после успешного добавления (например, для уведомления).
 */
export default function AddTransactionDialog({ isOpen, onClose, onAdded }) {
  const { addTransaction } = useFinance();
  const [type, setType] = useState(DEFAULT_TYPE);
  const [rawAmount, setRawAmount] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES_BY_TYPE[DEFAULT_TYPE][0].id);
  const [comment, setComment] = useState('');

  const categories = CATEGORIES_BY_TYPE[type];
  const amount = Number(rawAmount) || 0;
  const isTooMuch = amount > AMOUNT_LIMIT.max;
  const canSubmit = amount > 0 && !isTooMuch;
  const t = ADD_TRANSACTION;

  const reset = () => {
    setType(DEFAULT_TYPE);
    setRawAmount('');
    setCategoryId(CATEGORIES_BY_TYPE[DEFAULT_TYPE][0].id);
    setComment('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // При смене типа выбираем первую категорию нового списка
  const handleTypeChange = (nextType) => {
    setType(nextType);
    setCategoryId(CATEGORIES_BY_TYPE[nextType][0].id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    addTransaction({ type, amount, categoryId, comment: comment.trim() });
    reset();
    onAdded();
  };

  const inputClass =
    'h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:border-brand focus:bg-white focus:outline-none';

  return (
    <Modal isOpen={isOpen} title={t.title} onClose={handleClose} closeLabel={t.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <SegmentedControl
          id="add-tx-type"
          options={t.types}
          value={type}
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
            <span className={`mr-1 text-2xl font-bold ${type === 'income' ? 'text-positive' : 'text-ink-muted'}`}>
              {type === 'income' ? '+' : '−'}
            </span>
            <input
              id="add-tx-amount"
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              value={rawAmount}
              onChange={(e) => setRawAmount(e.target.value)}
              placeholder="0"
              className="no-spinner h-14 w-full bg-transparent text-2xl font-bold text-ink placeholder:text-ink-muted/50 focus:outline-none"
            />
            <span className="text-2xl font-bold text-ink-muted">₽</span>
          </div>
          {isTooMuch && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {AMOUNT_LIMIT.error} — {formatMoney(AMOUNT_LIMIT.max)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {t.quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRawAmount(String(value))}
                className="rounded-full bg-brand-light px-4 py-2 text-xs font-semibold text-brand transition-colors duration-200 hover:bg-brand-soft"
              >
                {formatMoney(value)}
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
              const isActive = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-[11px] font-semibold transition-colors duration-200 ${
                    isActive ? 'border-brand bg-brand-light/60 text-ink' : 'border-transparent bg-surface text-ink-secondary hover:bg-brand-light/40'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${ACCENTS[category.accent].tile}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="add-tx-comment" className="text-xs font-medium text-ink-muted">
            {t.commentLabel}
          </label>
          <input
            id="add-tx-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.commentPlaceholder}
            className={`mt-2 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="md" onClick={handleClose}>
            {t.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canSubmit} className="disabled:opacity-40 disabled:shadow-none">
            {t.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
