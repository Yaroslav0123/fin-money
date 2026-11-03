import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { monthName } from '../../utils/dates.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * Приглашение посмотреть «Итоги месяца» рядом с «пульсом дня».
 * Пока итоги этого месяца не открывали — яркая пилюля с переливающимся фоном и мягким свечением,
 * чтобы её заметили. После просмотра (seen) — спокойная, в цветах сайта, с кнопкой «Ещё раз».
 * monthStart — какой месяц в итогах (recapMonth), onOpen — открыть истории.
 */
export default function RecapBanner({ monthStart, seen = false, texts, onOpen, className = '' }) {
  const title = fillTemplate(texts.title, { month: monthName(monthStart) });

  if (seen) {
    return (
      <motion.button
        type="button"
        onClick={onOpen}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center gap-3 rounded-full bg-card py-2 pl-2 pr-2 text-left text-sm ring-1 ring-brand-muted transition-colors duration-200 hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-bold text-ink">{title}</span>
          <span className="block text-xs text-ink-muted">{texts.text}</span>
        </span>
        <span className="ml-1 rounded-full bg-brand-fill px-3 py-1 text-xs font-bold text-white">{texts.again}</span>
      </motion.button>
    );
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      {/* Мягкое свечение вокруг — «посмотри меня» */}
      <motion.span
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#6B4BD8] to-[#C2456B] blur-md"
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.button
        type="button"
        onClick={onOpen}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#3B2F7A] via-[#6B4BD8] to-[#C2456B] bg-[length:200%_100%] py-2 pl-2 pr-4 text-left text-sm text-white shadow-soft transition-[background-position] duration-700 hover:bg-right focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
          <span className="block font-bold">{title}</span>
          <span className="block text-xs text-white/80">{texts.text}</span>
        </span>
        <span className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{texts.action}</span>
      </motion.button>
    </span>
  );
}
