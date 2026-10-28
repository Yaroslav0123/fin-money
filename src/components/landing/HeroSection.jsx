import { motion } from 'framer-motion';
import { ArrowRight, Target } from 'lucide-react';
import Button3D from '../ui/Button3D.jsx';
import Container from './Container.jsx';
import LaptopMockup from './LaptopMockup.jsx';
import { EXPENSE_CATEGORIES, LANDING, SAVINGS, SUMMARY } from '../../data/mockData.js';

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

/**
 * Первый экран лендинга: заголовок, описание, кнопка и превью приложения на ноутбуке.
 */
export default function HeroSection({ appName, onStart }) {
  const { hero } = LANDING;

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
          </motion.p>

          <motion.p variants={item} className="mt-6 text-sm leading-relaxed text-ink-muted">
            {hero.textLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.p>

          {/* Главное действие сайта — крупная объёмная кнопка */}
          <motion.div variants={item} className="mt-10">
            <Button3D onClick={onStart} className="w-full sm:w-72">
              {hero.action}
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button3D>
          </motion.div>
        </motion.div>

        {/* Превью приложения */}
        <motion.div
          className="relative lg:-mr-8"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <FloatingLeaf className="-left-6 top-[38%] z-10 hidden w-16 sm:block" />
          <FloatingLeaf className="left-[4%] top-[18%] z-10 hidden w-6 opacity-70 sm:block" delay={1.5} />

          <LaptopMockup
            appName={appName}
            sidebar={LANDING.previewSidebar}
            summary={SUMMARY}
            categories={EXPENSE_CATEGORIES}
            savings={SAVINGS}
            savingsIcon={Target}
            donut={{ title: LANDING.overview.donutTitle, caption: LANDING.overview.donutCaption }}
          />
        </motion.div>
      </Container>
    </section>
  );
}
