import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { ACCENT_LABELS, CATEGORY_ACCENTS, CATEGORY_ICON_LABELS, CATEGORY_ICONS } from '../../data/mockData.js';
import { ACCENTS } from '../../theme/accents.js';

const ICON_IDS = Object.keys(CATEGORY_ICONS);

/**
 * Диалог категории: название, иконка и цвет. category — изменяемая категория или null для новой.
 * onSave({ name, iconId, accent }). Монтируется заново для каждой категории (key у родителя).
 */
export default function CategoryDialog({ isOpen, category = null, texts, onClose, onSave }) {
  const [name, setName] = useState(category?.name ?? '');
  const [iconId, setIconId] = useState(category?.iconId ?? ICON_IDS[0]);
  const [accent, setAccent] = useState(category?.accent ?? CATEGORY_ACCENTS[0]);
  const canSave = name.trim().length > 0;
  const PreviewIcon = CATEGORY_ICONS[iconId];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSave) onSave({ name: name.trim(), iconId, accent });
  };

  return (
    <Modal isOpen={isOpen} title={category ? texts.editTitle : texts.addTitle} onClose={onClose} closeLabel={texts.cancel}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="category-name" className="text-xs font-medium text-ink-muted">
            {texts.nameLabel}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ACCENTS[accent].tile}`}>
              <PreviewIcon className="h-5 w-5" />
            </span>
            <input
              id="category-name"
              autoFocus
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={texts.namePlaceholder}
              className="h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:border-brand focus:bg-card focus:outline-none"
            />
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-ink-muted">{texts.iconLabel}</legend>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {ICON_IDS.map((id) => {
              const Icon = CATEGORY_ICONS[id];
              const isActive = id === iconId;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={CATEGORY_ICON_LABELS[id]}
                  aria-pressed={isActive}
                  onClick={() => setIconId(id)}
                  className={`flex aspect-square items-center justify-center rounded-xl transition-colors duration-200 ${
                    isActive ? 'bg-brand text-white' : 'bg-surface text-ink-secondary hover:bg-brand-light'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium text-ink-muted">{texts.colorLabel}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORY_ACCENTS.map((id) => (
              <button
                key={id}
                type="button"
                aria-label={ACCENT_LABELS[id]}
                aria-pressed={id === accent}
                onClick={() => setAccent(id)}
                className={`h-9 w-9 rounded-full ${ACCENTS[id].dot} transition-transform duration-200 hover:scale-110 ${
                  id === accent ? 'ring-2 ring-ink ring-offset-2' : ''
                }`}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="md" onClick={onClose}>
            {texts.cancel}
          </Button>
          <Button type="submit" size="md" disabled={!canSave} className="disabled:opacity-40 disabled:shadow-none">
            {category ? texts.save : texts.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
