import Button from './Button.jsx';
import Modal from './Modal.jsx';

/**
 * Подтверждение необратимого действия (удаление, замена данных).
 * isOpen — показан ли диалог; text — пояснение под заголовком (необязательно).
 * Кнопка подтверждения красная, фокус по умолчанию — на окне, а не на ней.
 */
export default function ConfirmDialog({ isOpen, title, text, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} closeLabel={cancelLabel}>
      {text && <p className="text-sm leading-relaxed text-ink-secondary">{text}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button size="md" className="bg-negative shadow-none hover:bg-negative/90" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
