import { motion } from 'framer-motion';

// Прогресс-бар, который плавно заполняется при появлении на экране
export default function ProgressBar({ value, className = '' }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-black/5 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-brand to-accent-green"
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}
