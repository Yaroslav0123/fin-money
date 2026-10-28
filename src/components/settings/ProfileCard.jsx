import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

// Инициалы для аватара: «Мария Смирнова» → «МС», «Маша» → «М»
const MAX_INITIALS = 2;
const toInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

// Простая проверка адреса почты: что-то@что-то.домен
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Поле заполнено правильно: обязательное не пустое, почта похожа на адрес
const isFieldValid = (field, value) => {
  const trimmed = value.trim();
  if (field.required && !trimmed) return false;
  if (field.type === 'email' && trimmed && !EMAIL_PATTERN.test(trimmed)) return false;
  return true;
};

/**
 * Карточка профиля: аватар с инициалами и форма личных данных.
 * Кнопка «Сохранить» активна, только если что-то изменилось и все поля заполнены верно.
 */
export default function ProfileCard({ texts, onSave }) {
  const [saved, setSaved] = useState(texts.defaults);
  const [form, setForm] = useState(texts.defaults);
  const isDirty = texts.fields.some((field) => form[field.id] !== saved[field.id]);
  const invalidIds = texts.fields.filter((field) => !isFieldValid(field, form[field.id])).map((field) => field.id);
  const canSave = isDirty && invalidIds.length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    // Сохраняем без лишних пробелов по краям
    const trimmed = Object.fromEntries(Object.entries(form).map(([id, value]) => [id, value.trim()]));
    setForm(trimmed);
    setSaved(trimmed);
    onSave();
  };

  return (
    <Card className="h-full p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent-green text-2xl font-bold text-white shadow-button">
          {toInitials(saved.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight text-ink">{saved.name}</p>
          <p className="truncate text-sm text-ink-muted">{saved.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">
            <BadgeCheck className="h-3.5 w-3.5" />
            {texts.plan}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <p className="text-xs text-ink-muted">{texts.description}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {texts.fields.map((field) => {
            const isInvalid = invalidIds.includes(field.id);
            const errorId = `profile-${field.id}-error`;
            return (
              <label key={field.id} className={field.id === 'name' ? 'sm:col-span-2' : ''}>
                <span className="text-xs font-medium text-ink-muted">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.id]}
                  required={field.required}
                  aria-invalid={isInvalid}
                  aria-describedby={isInvalid ? errorId : undefined}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  className={`mt-2 h-12 w-full rounded-2xl border-2 bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 focus:bg-white focus:outline-none ${
                    isInvalid ? 'border-negative' : 'border-transparent focus:border-brand'
                  }`}
                />
                {isInvalid && (
                  <span id={errorId} className="mt-1.5 block text-xs text-negative">
                    {field.error}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <Button
          type="submit"
          size="md"
          pill
          disabled={!canSave}
          className="mt-6 px-10 disabled:opacity-40 disabled:shadow-none"
        >
          {texts.save}
        </Button>
      </form>
    </Card>
  );
}
