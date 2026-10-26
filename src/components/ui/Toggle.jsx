import { motion } from 'framer-motion';

/**
 * Переключатель «вкл / выкл» в стиле iOS.
 * Кружок плавно переезжает с пружинной анимацией.
 */
export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        checked ? 'justify-end bg-brand' : 'justify-start bg-black/10'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="h-5 w-5 rounded-full bg-white shadow-soft"
      />
    </button>
  );
}
