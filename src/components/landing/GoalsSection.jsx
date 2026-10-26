import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import { GOALS, LANDING } from '../../data/mockData.js';
import { formatMoney, toPercent } from '../../utils/format.js';

// Строка одной цели: название, прогресс и накопленная сумма
function GoalRow({ goal, progressOf }) {
  const percent = toPercent(goal.saved, goal.target);

  return (
    <li className="grid items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_13rem] sm:gap-8">
      <div className="flex items-center gap-3">
        <IconTile icon={goal.icon} accent={goal.accent} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">{goal.deadline}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar value={percent} />
        <span className="w-10 shrink-0 text-right text-xs font-semibold text-ink-secondary">{percent}%</span>
      </div>

      <p className="text-sm font-semibold text-brand sm:text-right">
        {formatMoney(goal.saved)} <span className="font-normal text-ink-muted">{progressOf} {formatMoney(goal.target)}</span>
      </p>
    </li>
  );
}

// Секция «Цели»: список финансовых целей с прогрессом
export default function GoalsSection() {
  const { goals } = LANDING;

  return (
    <section id="goals" className="scroll-mt-20">
      <Container className="pb-16">
        <Reveal>
          <Card className="p-6 sm:p-8">
            <SectionHeading
              eyebrow={goals.eyebrow}
              title={goals.title}
              description={goals.description}
              action={<LinkArrow>{goals.allLink}</LinkArrow>}
            />
            <ul className="mt-4 divide-y divide-line">
              {GOALS.map((goal) => (
                <GoalRow key={goal.id} goal={goal} progressOf={goals.progressOf} />
              ))}
            </ul>
          </Card>
        </Reveal>
      </Container>
    </section>
  );
}
