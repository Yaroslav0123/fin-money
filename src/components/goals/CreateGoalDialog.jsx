import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { ACCENTS } from '../../theme/accents.js';
import { addDays, addMonths, fromDateInputValue, monthsBetween, toDateInputValue } from '../../utils/dates.js';
import {
  currencySymbol,
  fillTemplate,
  formatMoney,
  fromDisplayAmount,
  monthlyPayment,
  toDisplayAmount,
} from '../../utils/format.js';

const DEFAULT_TERM = 12;
const DISPLAY_PRECISION = 100;

// Подпись поля формы
function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-muted">
      {children}
    </label>
  );
}

// Начальные значения: пустая форма или данные изменяемой цели
const initialForm = (goal, iconOptions) => {
  if (!goal) {
    return { name: '', rawTarget: '', deadline: toDateInputValue(addMonths(new Date(), DEFAULT_TERM)), iconId: iconOptions[0].id };
  }
  return {
    name: goal.name,
    rawTarget: String(Math.round(toDisplayAmount(goal.target) * DISPLAY_PRECISION) / DISPLAY_PRECISION),
    deadline: toDateInputValue(new Date(goal.deadline)),
    iconId: goal.iconId,
  };
};

/**
 * Диалог цели: создание новой или изменение существующей (goal).
 * Название, сумма (в валюте отображения), срок — датой или быстрым выбором «через N мес.», иконка.
 * Сразу показывает, сколько нужно откладывать в месяц.
 * onSave(draft) получает { name, target (₽), deadline (Date), iconId, accent }.
 * Для каждой цели монтируется заново (key у родителя), поэтому форма сразу заполнена.
 */
export default function CreateGoalDialog({ isOpen, goal = null, texts, iconOptions, termOptions, onClose, onSave }) {
  const [form, setForm] = useState(() => initialForm(goal, iconOptions));
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const isEdit = Boolean(goal);

  const todayValue = toDateInputValue(new Date());
  const target = fromDisplayAmount(Number(form.rawTarget) || 0);
  // Срок — полдень выбранного дня, чтобы не зависеть от часового пояса
  const deadline = form.deadline ? fromDateInputValue(form.deadline, new Date(new Date().setHours(12, 0, 0, 0))) : null;
  const isPast = !deadline || form.deadline <= todayValue;
  // Нельзя сделать цель меньше, чем на ней уже лежит
  const saved = goal?.saved ?? 0;
  const isBelowSaved = target > 0 && target < saved;
  const canSave = form.name.trim().length > 0 && target > 0 && !isPast && !isBelowSaved;
  const monthsLeft = deadline ? Math.max(1, monthsBetween(new Date(), deadline)) : 1;

  const reset = () => setForm(initialForm(null, iconOptions));

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    const option = iconOptions.find((o) => o.id === form.iconId) ?? iconOptions[0];
    onSave({ name: form.name.trim(), target, deadline, iconId: option.id, accent: option.accent });
    reset();
  };

  const inputClass =
    'mt-2 h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:border-brand focus:bg-white focus:outline-none';

  return (
    <Modal isOpen={isOpen} title={isEdit ? texts.editTitle : texts.title} onClose={handleClose} closeLabel={texts.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="goal-name">{texts.nameLabel}</FieldLabel>
          <input
            id="goal-name"
            autoFocus
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={texts.namePlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="goal-target">{texts.targetLabel}</FieldLabel>
          <input
            id="goal-target"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.rawTarget}
            onChange={(e) => set({ rawTarget: e.target.value })}
            placeholder={`0 ${currencySymbol()}`}
            aria-invalid={isBelowSaved}
            className={`no-spinner ${inputClass} ${isBelowSaved ? 'border-negative' : ''}`}
          />
          {isBelowSaved && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {fillTemplate(texts.targetBelowSaved, { amount: formatMoney(saved) })}
            </p>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="goal-deadline">{texts.termLabel}</FieldLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {termOptions.map((months) => {
              const value = toDateInputValue(addMonths(new Date(), months));
              return (
                <button
                  key={months}
                  type="button"
                  onClick={() => set({ deadline: value })}
                  aria-pressed={value === form.deadline}
                  className={`h-10 rounded-xl text-xs font-semibold transition-colors duration-200 ${
                    value === form.deadline ? 'bg-brand text-white' : 'bg-surface text-ink-secondary hover:bg-brand-light'
                  }`}
                >
                  {months} {texts.termSuffix}
                </button>
              );
            })}
          </div>
          <input
            id="goal-deadline"
            type="date"
            aria-label={texts.deadlineLabel}
            min={toDateInputValue(addDays(new Date(), 1))}
            value={form.deadline}
            onChange={(e) => set({ deadline: e.target.value })}
            aria-invalid={isPast}
            className={`${inputClass} ${isPast ? 'border-negative' : ''}`}
          />
          {isPast && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {texts.pastDeadline}
            </p>
          )}
        </div>

        <div>
          <FieldLabel>{texts.iconLabel}</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {iconOptions.map((option) => {
              const Icon = option.icon;
              const isActive = option.id === form.iconId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set({ iconId: option.id })}
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
        {target > saved && !isPast && (
          <p className="rounded-2xl bg-brand-light px-4 py-3 text-xs text-ink-secondary">
            {texts.perMonthHint}{' '}
            <span className="font-bold text-brand">{formatMoney(monthlyPayment(target - saved, monthsLeft))}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" size="md" onClick={handleClose}>
            {texts.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canSave} className="disabled:opacity-40 disabled:shadow-none">
            {isEdit ? texts.save : texts.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
