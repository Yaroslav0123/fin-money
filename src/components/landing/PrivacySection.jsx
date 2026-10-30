import IconTile from '../ui/IconTile.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { LANDING } from '../../data/mockData.js';

// Секция «Выписка не уходит с вашего устройства»: где читаются и хранятся данные
export default function PrivacySection() {
  const { privacy } = LANDING;
  const { openAbout } = useAppActions();

  return (
    <section id="privacy" className="scroll-mt-20">
      <Container className="pb-16">
        <Reveal>
          <div className="rounded-panel bg-brand-light/70 p-6 sm:p-10">
            <SectionHeading eyebrow={privacy.eyebrow} title={privacy.title} description={privacy.description} />
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {privacy.points.map((point) => (
                <li key={point.id} className="flex gap-4">
                  <IconTile icon={point.icon} accent="white" />
                  <div>
                    <h3 className="text-sm font-bold text-ink">{point.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => openAbout('privacy')} className="mt-6 text-xs font-semibold text-brand hover:underline">
              {privacy.more}
            </button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
