import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { parseAmount } from '../../utils/csv.js';
import { currencySymbol, fromDisplayAmount, toDisplayAmount } from '../../utils/format.js';

const DISPLAY_PRECISION = 100;

// Копейки → текст поля в валюте отображения: 150050 → «1500,5»
const toFieldValue = (kopecks) => String(Math.round(toDisplayAmount(kopecks) * DISPLAY_PRECISION) / DISPLAY_PRECISION).replace('.', ',');

/**
 * Диалог счёта: название и начальный остаток. account — изменяемый счёт или null для нового.
 * Остаток вводится в валюте отображения, с копейками через запятую или точку, может быть отрицательным.
 * onSave({ name, openingBalance (копейки) }). Монтируется заново для каждого счёта (key у родителя).
 */
export default function AccountDialog({ isOpen, account = null, texts, onClose, onSave }) {
  const [name, setName] = useState(account?.name ?? '');
  const [rawOpening, setRawOpening] = useState(account ? toFieldValue(account.openingBalance) : '');
  // Пустое поле — ноль
  const opening = rawOpening.trim() ? parseAmount(rawOpening) : 0;
  const isOpeningValid = opening !== null;
  const canSave = name.trim().length > 0 && isOpeningValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSave) onSave({ name: name.trim(), openingBalance: fromDisplayAmount(opening) });
  };

  const inputClass =
    'mt-2 h-12 w-full rounded-2xl border-2 bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:bg-card focus:outline-none';

  return (
    <Modal isOpen={isOpen} title={account ? texts.editTitle : texts.addTitle} onClose={onClose} closeLabel={texts.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="account-name" className="text-xs font-medium text-ink-muted">
            {texts.nameLabel}
          </label>
          <input
            id="account-name"
            autoFocus
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={texts.namePlaceholder}
            className={`${inputClass} border-transparent focus:border-brand`}
          />
        </div>

        <div>
          <label htmlFor="account-opening" className="text-xs font-medium text-ink-muted">
            {texts.openingLabel}, {currencySymbol()}
          </label>
          <input
            id="account-opening"
            inputMode="decimal"
            value={rawOpening}
            onChange={(e) => setRawOpening(e.target.value)}
            placeholder="0"
            aria-invalid={!isOpeningValid}
            aria-describedby="account-opening-hint"
            className={`${inputClass} ${isOpeningValid ? 'border-transparent focus:border-brand' : 'border-negative'}`}
          />
          <p id="account-opening-hint" className={`mt-2 text-xs ${isOpeningValid ? 'text-ink-muted' : 'text-negative'}`} role={isOpeningValid ? undefined : 'alert'}>
            {isOpeningValid ? texts.openingHint : texts.openingError}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="md" onClick={onClose}>
            {texts.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canSave} className="disabled:opacity-40 disabled:shadow-none">
            {account ? texts.save : texts.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
