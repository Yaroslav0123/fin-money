import { motion } from 'framer-motion';

// Варианты оформления кнопки
const VARIANTS = {
  primary: 'bg-brand-fill text-white shadow-button hover:bg-brand-dark',
  secondary: 'bg-ink/5 text-ink hover:bg-ink/10',
  ghost: 'bg-transparent text-brand hover:bg-brand-light',
  // Контурная светлая — для тёмных фонов (баннер внизу лендинга)
  outlineLight: 'border border-white/70 bg-transparent text-white hover:bg-white hover:text-brand',
};

// Размеры кнопки
const SIZES = {
  sm: 'h-10 px-5 text-sm',
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
};

/**
 * Универсальная кнопка с лёгкой анимацией нажатия.
 * fullWidth — растянуть на всю ширину, pill — полностью круглые края.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  pill = false,
  className = '',
  ...props
}) {
  const widthClass = fullWidth ? 'w-full' : '';
  const shapeClass = pill ? 'rounded-full' : 'rounded-2xl';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className={`group inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${shapeClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
