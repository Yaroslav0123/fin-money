import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, Pause, PiggyBank, Play, Receipt, Sparkles, Trophy, X } from 'lucide-react';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { MONTH_RECAP } from '../../data/mockData.js';
import { formatDay, monthName } from '../../utils/dates.js';
import { monthRecap, recapMonth } from '../../utils/finance.js';
import { fillTemplate, formatMoney, plural, toPercent } from '../../utils/format.js';

// Как часто обновляется полоска прогресса карточки
const TICK_MS = 100;
const FULL = 1;
// Фоны карточек по очереди: насыщенные, чтобы белый текст читался в обеих темах
const BACKGROUNDS = [
  'from-[#134634] to-[#237A5B]',
  'from-[#3B2F7A] to-[#6B4BD8]',
  'from-[#7A2E4A] to-[#C2456B]',
  'from-[#1E3F7A] to-[#3E74D6]',
  'from-[#6B3F0E] to-[#B86E1C]',
];

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/*
 * Карточки историй из итогов месяца (monthRecap). Карточка без данных пропускается:
 * нет доходов прошлого месяца — нет сравнения, ничего не отложено — нет карточки целей.
 * Каждая: { id, icon, eyebrow, title?, amount?, value?, text }.
 */
function buildSlides(recap, describe) {
  const s = MONTH_RECAP.slides;
  const month = monthName(recap.start);
  const slides = [
    {
      id: 'intro',
      icon: Sparkles,
      eyebrow: s.intro.eyebrow,
      title: fillTemplate(s.intro.title, { month: capitalize(month), year: recap.start.getFullYear() }),
      text: fillTemplate(s.intro.text, { count: recap.count, word: plural(recap.count, MONTH_RECAP.countWords) }),
    },
  ];

  const spentText =
    recap.income <= 0
      ? s.spent.noIncome
      : recap.left >= 0
        ? fillTemplate(s.spent.left, { income: formatMoney(recap.income), left: formatMoney(recap.left), percent: toPercent(recap.left, recap.income) })
        : fillTemplate(s.spent.over, { income: formatMoney(recap.income), over: formatMoney(-recap.left) });
  slides.push({ id: 'spent', icon: Receipt, eyebrow: s.spent.eyebrow, amount: recap.spent, text: spentText });

  if (recap.top) {
    slides.push({
      id: 'top',
      icon: recap.top.icon,
      eyebrow: s.top.eyebrow,
      title: recap.top.name,
      amount: recap.top.amount,
      text: fillTemplate(s.top.text, { share: recap.top.share }),
    });
  }

  if (recap.biggest) {
    const tx = describe(recap.biggest);
    slides.push({ id: 'biggest', icon: tx.icon, eyebrow: s.biggest.eyebrow, title: tx.title, amount: -recap.biggest.amount, text: formatDay(new Date(tx.date), recap.start) });
  }

  if (recap.previousSpent !== null && recap.previousSpent > 0) {
    const diff = recap.spent - recap.previousSpent;
    const percent = toPercent(Math.abs(diff), recap.previousSpent);
    const previousMonth = monthName(new Date(recap.start.getFullYear(), recap.start.getMonth() - 1, 1));
    const key = percent < 1 ? 'same' : diff < 0 ? 'less' : 'more';
    slides.push({
      id: 'compare',
      icon: diff <= 0 ? ArrowDown : ArrowUp,
      eyebrow: s.compare.eyebrow,
      value: key === 'same' ? '≈' : `${diff < 0 ? '−' : '+'}${percent}%`,
      text: fillTemplate(s.compare[key], { amount: formatMoney(Math.abs(diff)), month: previousMonth }),
    });
  }

  if (recap.busiestWeekday !== null) {
    slides.push({
      id: 'rhythm',
      icon: CalendarDays,
      eyebrow: s.rhythm.eyebrow,
      title: fillTemplate(s.rhythm.title, { count: recap.daysWithout, word: plural(recap.daysWithout, MONTH_RECAP.dayWords) }),
      text: fillTemplate(s.rhythm.text, { weekday: MONTH_RECAP.weekdaysPlural[recap.busiestWeekday] }),
    });
  }

  if (recap.saved > 0) {
    slides.push({ id: 'goals', icon: PiggyBank, eyebrow: s.goals.eyebrow, amount: recap.saved, text: s.goals.text });
  }

  slides.push({ id: 'outro', icon: Trophy, title: s.outro.title, text: s.outro.text, isLast: true });
  return slides;
}

/**
 * «Итоги месяца» в виде историй на весь экран: карточки сменяются сами (полоски вверху),
 * нажатие на левую или правую половину — назад и вперёд, стрелки клавиатуры тоже. Пробел и кнопка — пауза.
 * Показывает последний месяц с операциями (recapMonth). onAnalytics — «Открыть аналитику» на последней карточке.
 */
export default function MonthRecap({ isOpen, onClose, onAnalytics }) {
  const { rawTransactions, categories, goals, describe, today } = useFinance();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  const monthStart = recapMonth(rawTransactions, today);
  const recap = monthStart ? monthRecap({ transactions: rawTransactions, categories, goals, monthStart, today }) : null;
  const slides = recap ? buildSlides(recap, describe) : [];
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const go = useCallback(
    (step) => {
      setProgress(0);
      setIndex((current) => Math.min(Math.max(current + step, 0), Math.max(slides.length - 1, 0)));
    },
    [slides.length],
  );

  // Пока окно открыто, страница под ним не прокручивается; после закрытия фокус возвращается на кнопку
  useEffect(() => {
    if (!isOpen) return undefined;
    openerRef.current = document.activeElement;
    document.body.classList.add('overflow-hidden');
    dialogRef.current?.focus();
    return () => {
      document.body.classList.remove('overflow-hidden');
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [isOpen]);

  // Таймер карточки: полоска заполняется, затем — следующая. На последней останавливаемся.
  useEffect(() => {
    if (!isOpen || paused || isLast) return undefined;
    const timer = setInterval(() => setProgress((value) => Math.min(FULL, value + TICK_MS / MONTH_RECAP.slideMs)), TICK_MS);
    return () => clearInterval(timer);
  }, [isOpen, paused, isLast, index]);

  useEffect(() => {
    if (progress >= FULL) go(1);
  }, [progress, go]);

  // Клавиатура: стрелки листают, пробел — пауза, Esc — закрыть
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ' && e.target === dialogRef.current) {
        e.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, go]);

  const background = BACKGROUNDS[index % BACKGROUNDS.length];
  const Icon = slide?.icon;
  const PauseIcon = paused ? Play : Pause;

  return (
    <AnimatePresence>
      {isOpen && slide && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/70 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={MONTH_RECAP.title}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br text-white shadow-lifted transition-colors duration-500 focus:outline-none sm:h-[min(720px,92vh)] sm:max-w-sm sm:rounded-panel ${background}`}
          >
            {/* Полоски прогресса: по одной на карточку */}
            <div className="flex gap-1.5 px-4 pt-[max(1rem,env(safe-area-inset-top))]" aria-hidden="true">
              {slides.map((item, i) => (
                <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <motion.span
                    className="block h-full origin-left rounded-full bg-white"
                    initial={false}
                    animate={{ scaleX: i < index ? FULL : i === index ? progress : 0 }}
                    transition={{ duration: TICK_MS / 1000, ease: 'linear' }}
                  />
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 pt-3">
              <p className="text-xs font-semibold text-white/80" aria-live="polite">
                {fillTemplate(MONTH_RECAP.progress, { current: index + 1, total: slides.length })}
              </p>
              <div className="flex gap-1">
                {!isLast && (
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    aria-label={paused ? MONTH_RECAP.play : MONTH_RECAP.pause}
                    className="rounded-full p-2 text-white/90 transition-colors duration-200 hover:bg-white/15"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={MONTH_RECAP.close}
                  className="rounded-full p-2 text-white/90 transition-colors duration-200 hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Нажатие на левую или правую половину листает карточки */}
            <div className="relative flex flex-1 flex-col">
              <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => go(-1)} />
              {!isLast && <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-y-0 right-0 z-10 w-2/3" onClick={() => go(1)} />}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.id}
                  className="flex flex-1 flex-col justify-center px-8 pb-6"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <motion.span
                    className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15"
                    initial={{ scale: 0.6, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                  >
                    <Icon className="h-8 w-8" strokeWidth={2.2} />
                  </motion.span>
                  {slide.eyebrow && <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-white/75">{slide.eyebrow}</p>}
                  {slide.title && <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">{slide.title}</h2>}
                  {slide.amount !== undefined && (
                    <p className="mt-3 text-5xl font-extrabold tracking-tight">
                      <AnimatedMoney value={slide.amount} />
                    </p>
                  )}
                  {slide.value && <p className="mt-3 text-6xl font-extrabold tracking-tight">{slide.value}</p>}
                  <p className="mt-5 text-base leading-relaxed text-white/85">{slide.text}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-20 flex items-center gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label={MONTH_RECAP.prev}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-white/25 disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {isLast ? (
                <div className="flex flex-1 gap-2">
                  <button
                    type="button"
                    onClick={onAnalytics}
                    className="h-11 flex-1 rounded-full bg-white px-4 text-sm font-bold text-ink transition-transform duration-200 hover:scale-[1.02]"
                  >
                    {MONTH_RECAP.slides.outro.analytics}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-11 rounded-full bg-white/15 px-4 text-sm font-bold transition-colors duration-200 hover:bg-white/25"
                  >
                    {MONTH_RECAP.slides.outro.done}
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label={MONTH_RECAP.next}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-white/25"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
