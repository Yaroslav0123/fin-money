import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import Button3D from '../ui/Button3D.jsx';
import Container from './Container.jsx';
import LaptopMockup from './LaptopMockup.jsx';
import LiveFeed from './LiveFeed.jsx';
import { EXPENSE_CATEGORIES, LANDING, SUMMARY } from '../../data/mockData.js';

// Каскадное появление текстов слева
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Декоративный лист, который плавно «парит»
function FloatingLeaf({ className, delay = 0 }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
      animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <path className="fill-brand/80" d="M4 44C6 22 24 6 46 4c-2 22-18 40-42 40Z" />
      <path className="fill-none stroke-white/40" strokeWidth="1.5" strokeLinecap="round" d="M8 40C18 30 28 20 40 10" />
    </motion.svg>
  );
}

// Как часто сменяется слово в заголовке и насколько (в градусах) ноутбук наклоняется за мышью
const WORD_INTERVAL_MS = 2600;
const MAX_TILT = 7;
const NO_TILT = { x: 0, y: 0 };

// Последнее слово заголовка, которое само сменяется: «деньги» → «рубли» → «копейки»…
function RotatingWord({ words }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % words.length), WORD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [words.length, reduceMotion]);

  return (
    <>
      <span className="sr-only">{words[0]}</span>
      <span className="relative inline-flex overflow-hidden align-bottom" aria-hidden="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={words[index]}
            className="inline-block bg-gradient-to-r from-brand to-accent-green bg-clip-text text-transparent"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}

/**
 * Первый экран лендинга: заголовок, описание, кнопки и превью приложения на ноутбуке.
 * onStart — «Мои финансы», onTrySample — открыть приложение и загрузить пример выписки.
 * Живые детали: слово в заголовке сменяется, у ноутбука всплывают уведомления, сам ноутбук слегка наклоняется за мышью.
 */
export default function HeroSection({ appName, onStart, onTrySample }) {
  const { hero } = LANDING;
  // Наклон ноутбука в градусах: x — вперёд/назад, y — влево/вправо
  const [tilt, setTilt] = useState(NO_TILT);

  const handleTilt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -dy * MAX_TILT, y: dx * MAX_TILT });
  };

  return (
    <section id="top" className="relative scroll-mt-20 overflow-hidden border-b border-line">
      {/* Мягкое зелёное пятно за ноутбуком */}
      <div className="pointer-events-none absolute -right-40 -top-24 h-[640px] w-[760px] rounded-full bg-gradient-to-bl from-brand-soft via-brand-light to-transparent opacity-80 blur-2xl" />

      <Container className="relative grid items-center gap-14 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex rounded-full bg-ink/[0.04] px-3 py-1 text-xs font-medium text-ink-secondary"
          >
            {hero.badge}
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-4 text-6xl font-extrabold leading-none tracking-tight text-ink sm:text-7xl"
          >
            {appName}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-2xl font-semibold leading-snug tracking-tight text-ink-secondary sm:text-[28px]"
          >
            {hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block">
              {hero.titleRotating.before} <RotatingWord words={hero.titleRotating.words} />
            </span>
          </motion.p>

          <motion.p variants={item} className="mt-6 text-sm leading-relaxed text-ink-muted">
            {hero.textLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.p>

          {/* Главное действие сайта — крупная объёмная кнопка */}
          <motion.div variants={item} className="mt-10 flex flex-col items-start gap-4">
            <Button3D onClick={onStart} className="w-full sm:w-72">
              {hero.action}
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button3D>
            <button
              type="button"
              onClick={onTrySample}
              className="inline-flex items-center gap-2 rounded-full px-1 text-sm font-semibold text-brand transition-colors duration-200 hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <FileText className="h-4 w-4" />
              {hero.sampleAction}
            </button>
          </motion.div>
        </motion.div>

        {/* Превью приложения */}
        <motion.div
          className="relative [perspective:1400px] lg:-mr-8"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          onMouseMove={handleTilt}
          onMouseLeave={() => setTilt(NO_TILT)}
        >
          <FloatingLeaf className="-left-6 top-[38%] z-10 hidden w-16 sm:block" />
          <FloatingLeaf className="left-[4%] top-[18%] z-10 hidden w-6 opacity-70 sm:block" delay={1.5} />

          <LiveFeed items={hero.liveFeed} className="-bottom-8 left-2 hidden sm:block lg:-left-10" />

          {/* Ноутбук слегка поворачивается вслед за мышью */}
          <motion.div animate={{ rotateX: tilt.x, rotateY: tilt.y }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
            <LaptopMockup
              appName={appName}
              sidebar={LANDING.previewSidebar}
              summary={SUMMARY}
              categories={EXPENSE_CATEGORIES}
              budgets={LANDING.previewBudgets}
              donut={{ title: LANDING.overview.donutTitle, caption: LANDING.overview.donutCaption }}
            />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
