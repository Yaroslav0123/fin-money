import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Элементы, на которые можно перейти клавишей Tab.
// framer-motion ставит кнопкам tabindex="0", поэтому неактивные исключаем и в последнем правиле.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/**
 * Модальное окно. На телефоне выезжает снизу (как шторка),
 * на десктопе появляется по центру. Закрывается по Esc и клику по фону.
 * Пока окно открыто: фокус не уходит за его пределы, страница под ним не прокручивается,
 * а после закрытия фокус возвращается на кнопку, которая окно открыла.
 */
// Ширина окна на десктопе: обычная и широкая (для таблиц, например предпросмотра импорта)
const WIDTHS = { md: 'sm:max-w-md', lg: 'sm:max-w-2xl' };

export default function Modal({ isOpen, title, onClose, closeLabel, size = 'md', children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // Элемент, который открыл окно. Запоминаем при отрисовке: к моменту эффектов
  // фокус уже может перейти в поле с autoFocus внутри окна.
  const openerRef = useRef(null);
  const wasOpenRef = useRef(false);
  if (isOpen && !wasOpenRef.current) openerRef.current = document.activeElement;
  wasOpenRef.current = isOpen;

  // Esc закрывает окно, Tab и Shift+Tab ходят по кругу внутри окна
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const isInside = dialogRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !isInside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !isInside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Блокируем прокрутку страницы, после закрытия возвращаем фокус
  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = openerRef.current;
    document.body.classList.add('overflow-hidden');
    // Если внутри нет поля с autoFocus — фокусируем само окно
    if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
      dialogRef.current.focus();
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay/40 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-panel bg-card p-6 shadow-lifted focus:outline-none ${WIDTHS[size]} sm:rounded-panel sm:p-8`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-bold text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-full p-2 text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
