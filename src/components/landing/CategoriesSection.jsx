import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import Reveal from '../ui/Reveal.jsx';
import Container from './Container.jsx';
import SectionHeading from './SectionHeading.jsx';
import { EXPENSE_CATEGORIES, LANDING } from '../../data/mockData.js';
import { formatMoney } from '../../utils/format.js';

// Карточка одной категории расходов
function CategoryCard({ category }) {
  return (
    <Card className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
      <IconTile icon={category.icon} accent={category.accent} size="sm" />
      <p className="mt-4 text-sm font-medium text-ink">{category.name}</p>
      <p className="mt-0.5 text-base font-bold text-ink">{formatMoney(category.amount)}</p>
      <p className="text-xs text-ink-muted">{category.share}%</p>
    </Card>
  );
}

// Секция «Категории»: карточки расходов по категориям
export default function CategoriesSection() {
  const { categories } = LANDING;

  return (
    <section id="categories" className="scroll-mt-20">
      <Container className="py-16">
        <Reveal>
          <SectionHeading
            eyebrow={categories.eyebrow}
            title={categories.title}
            description={categories.description}
            action={<LinkArrow>{categories.allLink}</LinkArrow>}
          />
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {EXPENSE_CATEGORIES.map((category, index) => (
            <Reveal key={category.id} delay={index * 0.06}>
              <CategoryCard category={category} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
