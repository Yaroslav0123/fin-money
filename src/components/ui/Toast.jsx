import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck } from 'lucide-react';

// Сколько миллисекунд уведомление висит на экране
const AUTO_HIDE_MS = 2500;

/**
 * Короткое всплывающее уведомление внизу экрана.
 * Само скрывается через пару секунд (вызывает onHide).
 * icon — иконка lucide-react слева, по умолчанию галочка «готово».
 */
export default function Toast({ message, icon: Icon = CircleCheck, onHide }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onHide, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-5 lg:bottom-8">
      <AnimatePresence>
        {message && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lifted"
          >
            <Icon className="h-4 w-4 text-accent-green" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
