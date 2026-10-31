import { motion } from 'framer-motion';
import smesharikiImage from '../../assets/smeshariki.webp';

/*
 * Кадр со Смешариками (1280×720) и круг вокруг каждого героя.
 * Картинка внутри круга: ширина = 1280 / диаметр, сдвиг = край круга / диаметр (в процентах от размера круга).
 * Классы записаны целиком, чтобы Tailwind их нашёл.
 */
const CROPS = {
  sovunya: 'w-[512%] left-[-10%] top-[-118%]',
  karych: 'w-[492%] left-[-104%] top-[-100%]',
  losyash: 'w-[366%] left-[-126%] top-[-41%]',
  kopatych: 'w-[557%] left-[-311%] top-[-63%]',
  krosh: 'w-[427%] left-[-312%] top-[-47%]',
  yozhik: 'w-[533%] left-[-323%] top-[-188%]',
};

/**
 * Декоративный герой «Смешариков» в круглой рамке, который плавно «парит».
 * character — ключ из CROPS, className — положение, размер и с какой ширины экрана показывать.
 */
export default function Smesharik({ character, className = '', delay = 0 }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 overflow-hidden rounded-full bg-card shadow-lifted ring-4 ring-card ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay: 0.4 + delay },
        scale: { duration: 0.5, delay: 0.4 + delay },
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    >
      <img src={smesharikiImage} alt="" className={`absolute max-w-none ${CROPS[character]}`} />
    </motion.div>
  );
}
