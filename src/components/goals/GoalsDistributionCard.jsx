import DonutLegend from '../charts/DonutLegend.jsx';
import ExpenseDonut from '../charts/ExpenseDonut.jsx';
import Card from '../ui/Card.jsx';
import { formatMoney, toPercent } from '../../utils/format.js';

// Кольцевая диаграмма: как накопления распределены между целями
export default function GoalsDistributionCard({ goals, texts, className = '' }) {
  const withSavings = goals.filter((g) => g.saved > 0);
  const totalSaved = withSavings.reduce((sum, g) => sum + g.saved, 0);
  // Формат, который понимают ExpenseDonut и DonutLegend
  const slices = withSavings.map((g) => ({
    id: g.id,
    name: g.name,
    accent: g.accent,
    share: toPercent(g.saved, totalSaved),
  }));

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">{texts.empty}</p>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6">
          <ExpenseDonut
            data={slices}
            centerValue={formatMoney(totalSaved)}
            centerCaption={texts.caption}
            className="h-44 w-44"
            valueClassName="text-base"
          />
          <DonutLegend categories={slices} className="w-full gap-3 text-sm text-ink" />
        </div>
      )}
    </Card>
  );
}
