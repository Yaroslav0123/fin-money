import { useState } from 'react';
import BalanceAreaChart from '../charts/BalanceAreaChart.jsx';
import Card from '../ui/Card.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';

// Период графика по умолчанию
const DEFAULT_PERIOD = 'month';

// Карточка с графиком роста баланса и переключателем периода
export default function BalanceHistoryCard({ title, periods, history, className = '' }) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <SegmentedControl id="savings-screen-period" options={periods} value={period} onChange={setPeriod} />
      </div>
      <BalanceAreaChart data={history[period]} className="mt-6 h-64" />
    </Card>
  );
}
