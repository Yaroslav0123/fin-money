import { Sparkles, TrendingUp, TriangleAlert } from 'lucide-react';
import IconTile from '../ui/IconTile.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import { LANDING } from '../../data/mockData.js';
import { formatMoney } from '../../utils/format.js';

// Секция «Прогноз и советы»: что Fin Money подскажет по выписке. Справа — пример карточки прогноза (цифры статичные).
export default function ForecastSection() {
  const { forecast } = LANDING;
  const { example } = forecast;

  return (
    <section id="forecast" className="scroll-mt-20">
      <Container className="pb-16 pt-8 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <SectionHeading eyebrow={forecast.eyebrow} title={forecast.title} description={forecast.description} />
            <ul className="mt-8 grid gap-6">
              {forecast.points.map((point) => (
                <li key={point.id} className="flex gap-4">
                  <IconTile icon={point.icon} accent="brand" />
                  <div>
                    <h3 className="text-sm font-bold text-ink">{point.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Пример карточки прогноза, как на «Главной» */}
          <Reveal delay={0.1}>
            <div className="rounded-card bg-card p-6 shadow-lifted" aria-hidden="true">
              <div className="flex items-center gap-3">
                <IconTile icon={TrendingUp} accent="brand" size="sm" />
                <p className="text-base font-bold text-ink">{example.title}</p>
              </div>
              <p className="mt-5 text-sm text-ink-secondary">{example.left}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">≈ {formatMoney(example.amount)}</p>
              <p className="mt-5 flex items-start gap-2 text-sm text-ink-secondary">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-orange" />
                {example.alert}
              </p>
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-brand-light/70 p-4 text-sm leading-relaxed text-ink-secondary">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {example.tip}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
