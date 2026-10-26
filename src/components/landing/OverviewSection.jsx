import ExpenseStructureCard from '../cards/ExpenseStructureCard.jsx';
import StatCard from '../cards/StatCard.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import { EXPENSE_CATEGORIES, LANDING, SUMMARY } from '../../data/mockData.js';

// Порядок карточек как на макете: баланс, расходы, доходы
const STAT_ORDER = ['balance', 'expenses', 'income'];

// Секция «Обзор»: ключевые показатели и структура расходов
export default function OverviewSection() {
  const { overview } = LANDING;

  return (
    <section id="overview" className="scroll-mt-20">
      <Container className="grid gap-6 py-16 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Reveal>
            <SectionHeading eyebrow={overview.eyebrow} title={overview.title} description={overview.description} />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STAT_ORDER.map((key, index) => (
              <Reveal key={key} delay={index * 0.08}>
                <StatCard stat={SUMMARY[key]} />
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="lg:col-span-5">
          <ExpenseStructureCard
            title={overview.donutTitle}
            caption={overview.donutCaption}
            allLink={overview.allLink}
            categories={EXPENSE_CATEGORIES}
            total={SUMMARY.expenses.amount}
          />
        </Reveal>
      </Container>
    </section>
  );
}
