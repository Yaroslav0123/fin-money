import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { monthName } from '../../utils/dates.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * Приглашение посмотреть «Итоги месяца» рядом с «пульсом дня»: яркая пилюля с переливающимся фоном.
 * monthStart — какой месяц в итогах (recapMonth), onOpen — открыть истории.
 */
export default function RecapBanner({ monthStart, texts, onOpen, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#3B2F7A] via-[#6B4BD8] to-[#C2456B] bg-[length:200%_100%] py-2 pl-2 pr-4 text-left text-sm text-white shadow-soft transition-[background-position] duration-700 hover:bg-right focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}
    >
      <motion.span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20"
        animate={{ rotate: [0, 12, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </motion.span>
      <span className="min-w-0">
        <span className="block font-bold">{fillTemplate(texts.title, { month: monthName(monthStart) })}</span>
        <span className="block text-xs text-white/80">{texts.text}</span>
      </span>
      <span className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{texts.action}</span>
    </motion.button>
  );
}
