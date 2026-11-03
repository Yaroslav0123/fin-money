import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Github } from 'lucide-react';
import Container from '../components/landing/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import IconTile from '../components/ui/IconTile.jsx';
import Logo from '../components/ui/Logo.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { APP_NAME, TECH_PAGE } from '../data/mockData.js';

// Цвета шагов схемы по очереди
const FLOW_ACCENTS = ['blue', 'purple', 'green', 'orange', 'pink', 'brand'];

/**
 * Страница «Как это сделано» — для разработчиков и работодателей: стек, путь выписки через приложение,
 * ключевые решения и качество. Открывается из подвала лендинга и по адресу #tech (ссылку можно отправить).
 * onBack — на лендинг, onStart — в приложение.
 */
export default function TechPage({ onBack, onStart }) {
  const t = TECH_PAGE;

  return (
    <div className="min-h-full bg-surface">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/80 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary transition-colors duration-200 hover:text-brand">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </button>
          <Logo name={APP_NAME} size="sm" />
        </Container>
      </header>

      <main>
        {/* Вступление */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute -right-40 -top-24 h-[480px] w-[640px] rounded-full bg-gradient-to-bl from-brand-soft via-brand-light to-transparent opacity-80 blur-2xl" />
          <Container className="relative py-14 lg:py-20">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold uppercase tracking-wider text-brand">
              {t.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl"
            >
              {t.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary"
            >
              {t.intro}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
              <Button size="md" pill onClick={onStart}>
                {t.appAction}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
              <a
                href={t.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink/5 px-6 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink/10"
              >
                <Github className="h-4 w-4" />
                {t.repoAction}
              </a>
            </motion.div>

            {/* Стек — чипы */}
            <h2 className="sr-only">{t.stack.title}</h2>
            <ul className="mt-10 flex flex-wrap gap-2">
              {t.stack.items.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className="rounded-full bg-card px-4 py-2 text-sm shadow-soft"
                >
                  <span className="font-bold text-ink">{item.label}</span> <span className="text-ink-muted">· {item.hint}</span>
                </motion.li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Путь выписки */}
        <Container as="section" className="py-14">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{t.flow.title}</h2>
          </Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.flow.steps.map((step, i) => (
              <Reveal key={step.id} delay={i * 0.05}>
                <Card as="li" className="relative h-full p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lifted">
                  <span className="absolute right-5 top-5 text-3xl font-extrabold text-ink/10" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <IconTile icon={step.icon} accent={FLOW_ACCENTS[i % FLOW_ACCENTS.length]} />
                  <h3 className="mt-4 text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.text}</p>
                </Card>
              </Reveal>
            ))}
          </ol>
        </Container>

        {/* Решения */}
        <section className="border-y border-line bg-card">
          <Container className="py-14">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-ink">{t.decisions.title}</h2>
            </Reveal>
            <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {t.decisions.items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 2) * 0.05}>
                  <div className="border-l-2 border-brand pl-4">
                    <h3 className="text-base font-bold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Качество */}
        <Container as="section" className="py-14">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{t.quality.title}</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.quality.items.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.05}>
                <Card className="h-full p-6">
                  <p className="bg-gradient-to-r from-brand to-accent-green bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">{item.value}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{item.label}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </main>

      <footer>
        <Container className="border-t border-line py-6 text-xs text-ink-muted">{t.footer}</Container>
      </footer>
    </div>
  );
}
