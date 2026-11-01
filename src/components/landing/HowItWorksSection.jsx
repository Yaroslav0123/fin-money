import { FileText } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import ninjaPhoto from '../../assets/ninja-photo.webp';
import { WizardArt } from './HeroArt.jsx';
import Smesharik from './Smesharik.jsx';
import { LANDING } from '../../data/mockData.js';

/**
 * Секция «Как это работает»: три шага от выписки до аналитики и кнопка «Попробовать на примере выписки».
 * onTrySample — открыть приложение и загрузить образец выписки.
 */
export default function HowItWorksSection({ onTrySample }) {
  const { how } = LANDING;

  return (
    <section id="how" className="relative scroll-mt-20">
      {/* Кар-Карыч у левого края — только на широком экране */}
      <Smesharik character="karych" className="left-6 top-36 hidden h-32 w-32 min-[1600px]:block" delay={0.4} />
      <Container className="relative pt-16">
        {/* Волшебник на границе с первым экраном, ниндзя (картинка пользователя, лицо крупно) справа над шагами */}
        <Smesharik className="-top-[60px] left-[445px] hidden h-28 w-28 xl:block" delay={0.5}>
          <WizardArt />
        </Smesharik>
        <Smesharik className="-right-8 top-3 hidden h-44 w-44 xl:block" delay={1.1}>
          <img src={ninjaPhoto} alt="" className="absolute left-[-111%] top-[-5%] w-[320%] max-w-none" />
        </Smesharik>
        <Reveal>
          <SectionHeading eyebrow={how.eyebrow} title={how.title} description={how.description} />
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {how.steps.map((step, index) => (
            <li key={step.id}>
              <Reveal delay={index * 0.08} className="h-full">
                <Card className="relative h-full p-6">
                  <span className="absolute right-6 top-4 text-5xl font-extrabold text-ink/[0.06]" aria-hidden="true">
                    {index + 1}
                  </span>
                  <IconTile icon={step.icon} accent="brand" />
                  <h3 className="mt-5 text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.text}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal delay={0.2} className="mt-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Button size="md" pill variant="secondary" onClick={onTrySample}>
            <FileText className="h-4 w-4" />
            {how.sampleAction}
          </Button>
          <p className="text-xs text-ink-muted">{how.sampleHint}</p>
        </Reveal>
      </Container>
    </section>
  );
}
