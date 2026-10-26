import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { ACCENTS } from '../../theme/accents.js';
import { formatMoney, monthlyPayment } from '../../utils/format.js';

const DEFAULT_TERM = 12;

// Подпись поля формы
function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-muted">
      {children}
    </label>
  );
}

/**
 * Диалог создания новой цели: название, сумма, срок и иконка.
 * Сразу показывает, сколько нужно откладывать в месяц.
 */
export default function CreateGoalDialog({ isOpen, texts, iconOptions, termOptions, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [rawTarget, setRawTarget] = useState('');
  const [term, setTerm] = useState(DEFAULT_TERM);
  const [iconId, setIconId] = useState(iconOptions[0].id);

  const target = Number(rawTarget) || 0;
  const canCreate = name.trim().length > 0 && target > 0;

  const reset = () => {
    setName('');
    setRawTarget('');
    setTerm(DEFAULT_TERM);
    setIconId(iconOptions[0].id);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canCreate) return;
    const option = iconOptions.find((o) => o.id === iconId);
    onCreate({
      name: name.trim(),
      target,
      monthsLeft: term,
      deadline: `${texts.deadlinePrefix} ${term} ${texts.termSuffix}`,
      icon: option.icon,
      accent: option.accent,
    });
    reset();
  };

  const inputClass =
    'mt-2 h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:border-brand focus:bg-white focus:outline-none';

  return (
    <Modal isOpen={isOpen} title={texts.title} onClose={handleClose} closeLabel={texts.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="goal-name">{texts.nameLabel}</FieldLabel>
          <input
            id="goal-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={texts.namePlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="goal-target">{texts.targetLabel}</FieldLabel>
          <input
            id="goal-target"
            type="number"
            inputMode="numeric"
            min="0"
            value={rawTarget}
            onChange={(e) => setRawTarget(e.target.value)}
            placeholder="0 ₽"
            className={`no-spinner ${inputClass}`}
          />
        </div>

        <div>
          <FieldLabel>{texts.termLabel}</FieldLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {termOptions.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setTerm(months)}
                aria-pressed={months === term}
                className={`h-10 rounded-xl text-xs font-semibold transition-colors duration-200 ${
                  months === term ? 'bg-brand text-white' : 'bg-surface text-ink-secondary hover:bg-brand-light'
                }`}
              >
                {months} {texts.termSuffix}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>{texts.iconLabel}</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {iconOptions.map((option) => {
              const Icon = option.icon;
              const isActive = option.id === iconId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setIconId(option.id)}
                  aria-label={option.label}
                  aria-pressed={isActive}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                    ACCENTS[option.accent].tile
                  } ${isActive ? 'ring-2 ring-brand ring-offset-2' : 'opacity-60 hover:opacity-100'}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Подсказка с расчётом взноса */}
        {target > 0 && (
          <p className="rounded-2xl bg-brand-light px-4 py-3 text-xs text-ink-secondary">
            {texts.perMonthHint}{' '}
            <span className="font-bold text-brand">{formatMoney(monthlyPayment(target, term))}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" size="md" onClick={handleClose}>
            {texts.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canCreate} className="disabled:opacity-40 disabled:shadow-none">
            {texts.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
