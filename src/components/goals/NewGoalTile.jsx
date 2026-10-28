import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

// Пунктирная карточка-кнопка «Новая цель» в конце списка
export default function NewGoalTile({ title, hint, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-brand-soft bg-card/40 p-6 text-center transition-colors duration-200 hover:border-brand-muted hover:bg-brand-light/40"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand transition-transform duration-200 group-hover:scale-110">
        <Plus className="h-6 w-6" />
      </span>
      <span className="text-sm font-bold text-ink">{title}</span>
      <span className="max-w-[220px] text-xs leading-relaxed text-ink-muted">{hint}</span>
    </motion.button>
  );
}
