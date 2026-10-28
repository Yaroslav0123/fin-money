import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { AMOUNT_LIMIT } from '../../data/mockData.js';
import {
  currencyQuickAmounts,
  currencySymbol,
  formatDisplayMoney,
  formatMoney,
  fromDisplayAmount,
  toDisplayAmount,
} from '../../utils/format.js';

// Округление «максимума» в валюте отображения вниз, чтобы не превысить лимит
const DISPLAY_PRECISION = 100;
const floorDisplay = (value) => Math.floor(value * DISPLAY_PRECISION) / DISPLAY_PRECISION;

/**
 * Диалог пополнения или снятия.
 * mode — 'deposit' | 'withdraw' | null (закрыт).
 * hint — подсказка под полем: { label, amount } (в рублях).
 * limits — ограничения суммы [{ max, error }] в рублях; действует самое строгое.
 * Сумма вводится в валюте отображения; onConfirm(mode, amount) получает рубли.
 */
export default function AmountDialog({ mode, hint, limits = [], texts, onClose, onConfirm }) {
  const [rawAmount, setRawAmount] = useState('');

  // Общий потолок одной операции действует всегда, даже если экран не задал лимитов
  const ceiling = { max: AMOUNT_LIMIT.max, error: `${AMOUNT_LIMIT.error} — ${formatMoney(AMOUNT_LIMIT.max)}` };
  const amount = fromDisplayAmount(Number(rawAmount) || 0);
  const limit = [...limits, ceiling].reduce((strict, rule) => (rule.max < strict.max ? rule : strict));
  // Баланс может быть отрицательным — тогда доступно 0
  const maxAmount = Math.max(0, limit.max);
  const isTooMuch = amount > maxAmount;
  const canConfirm = amount > 0 && !isTooMuch;
  const modeTexts = mode ? texts[mode] : texts.deposit;

  // Сбрасываем введённую сумму при закрытии
  const handleClose = () => {
    setRawAmount('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canConfirm) return;
    onConfirm(mode, amount);
    setRawAmount('');
  };

  return (
    <Modal isOpen={Boolean(mode)} title={modeTexts.title} onClose={handleClose} closeLabel={texts.cancel}>
      <form onSubmit={handleSubmit}>
        <label className="text-xs font-medium text-ink-muted" htmlFor="amount-input">
          {texts.amountLabel}
        </label>
        <div
          className={`mt-2 flex items-center rounded-2xl border-2 bg-surface px-4 transition-colors duration-200 focus-within:bg-white ${
            isTooMuch ? 'border-negative' : 'border-transparent focus-within:border-brand'
          }`}
        >
          <input
            id="amount-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            autoFocus
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            placeholder={texts.amountPlaceholder}
            className="no-spinner h-14 w-full bg-transparent text-2xl font-bold text-ink placeholder:text-ink-muted/50 focus:outline-none"
          />
          <span className="text-2xl font-bold text-ink-muted">{currencySymbol()}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
          <p className={isTooMuch ? 'text-negative' : 'text-ink-muted'} role={isTooMuch ? 'alert' : undefined}>
            {isTooMuch ? limit.error : hint && `${hint.label}: ${formatMoney(hint.amount)}`}
          </p>
          {/* Подставляем максимально допустимую сумму */}
          {isTooMuch && maxAmount > 0 && (
            <button
              type="button"
              onClick={() => setRawAmount(String(floorDisplay(toDisplayAmount(maxAmount))))}
              className="font-semibold text-brand transition-colors duration-200 hover:text-brand-dark"
            >
              {texts.fillMax} ({formatMoney(maxAmount)})
            </button>
          )}
        </div>

        {/* Быстрый выбор суммы (в валюте отображения) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {currencyQuickAmounts('savingsQuick').map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRawAmount(String(value))}
              className="rounded-full bg-brand-light px-4 py-2 text-xs font-semibold text-brand transition-colors duration-200 hover:bg-brand-soft"
            >
              {formatDisplayMoney(value)}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="md" onClick={handleClose}>
            {texts.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canConfirm} className="disabled:opacity-40 disabled:shadow-none">
            {modeTexts.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
