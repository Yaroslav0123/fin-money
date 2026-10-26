import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Logo from '../ui/Logo.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import { LANDING } from '../../data/mockData.js';

// Тёмно-зелёный баннер с призывом начать пользоваться приложением
export default function CtaBanner({ appName, onStart }) {
  const { cta } = LANDING;

  return (
    <section id="about" className="scroll-mt-20">
      <Container className="pb-10">
        <Reveal>
          <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-panel bg-gradient-to-br from-brand-dark to-brand px-8 py-10 sm:flex-row sm:items-center sm:px-10">
            {/* Декоративные полупрозрачные круги */}
            <span className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/5" />
            <span className="pointer-events-none absolute -bottom-32 right-48 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative">
              <Logo name={appName} size="md" light />
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{cta.text}</p>
            </div>

            <Button variant="outlineLight" size="md" pill onClick={onStart} className="relative px-8">
              {cta.action}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
