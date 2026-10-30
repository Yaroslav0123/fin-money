import DonutLegend from '../charts/DonutLegend.jsx';
import { ExpenseDonut } from '../charts/lazy.jsx';
import { PieChart } from 'lucide-react';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { formatMoney } from '../../utils/format.js';

// Карточка «Структура расходов»: кольцевая диаграмма с легендой.
// emptyText — подпись, когда расходов нет (вместо пустого кольца).
export default function ExpenseStructureCard({ title, caption, allLink, emptyText, categories, total, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <LinkArrow to="analytics">{allLink}</LinkArrow>
      </div>
      {categories.length === 0 && emptyText ? (
        <EmptyState icon={PieChart} text={emptyText} />
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
          <ExpenseDonut
            data={categories}
            centerValue={formatMoney(total)}
            centerCaption={caption}
            className="h-40 w-40"
            valueClassName="text-lg"
          />
          <DonutLegend categories={categories} className="w-full gap-3 text-sm text-ink" />
        </div>
      )}
    </Card>
  );
}
