import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { formatMoney } from '../../utils/format.js';

/**
 * Диалог пополнения или снятия.
 * mode — 'deposit' | 'withdraw' | null (закрыт).
 * Сам диалог ничего не меняет: сумму получает onConfirm(mode, amount).
 */
export default function AmountDialog({ mode, balance, texts, onClose, onConfirm }) {
  const [rawAmount, setRawAmount] = useState('');

  const amount = Number(rawAmount) || 0;
  const isWithdraw = mode === 'withdraw';
  const isTooMuch = isWithdraw && amount > balance;
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
            inputMode="numeric"
            min="0"
            autoFocus
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            placeholder={texts.amountPlaceholder}
            className="no-spinner h-14 w-full bg-transparent text-2xl font-bold text-ink placeholder:text-ink-muted/50 focus:outline-none"
          />
          <span className="text-2xl font-bold text-ink-muted">₽</span>
        </div>

        <p className={`mt-2 text-xs ${isTooMuch ? 'text-negative' : 'text-ink-muted'}`}>
          {isTooMuch ? texts.errorTooMuch : `${texts.available}: ${formatMoney(balance)}`}
        </p>

        {/* Быстрый выбор суммы */}
        <div className="mt-4 flex flex-wrap gap-2">
          {texts.quickAmounts.map((value) => (
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
