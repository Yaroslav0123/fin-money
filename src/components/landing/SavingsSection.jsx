import { useState } from 'react';
import { Target } from 'lucide-react';
import BalanceAreaChart from '../charts/BalanceAreaChart.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import Reveal from '../ui/Reveal.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import Container from './Container.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { SAVINGS, SAVINGS_HISTORY, SAVINGS_PERIODS } from '../../data/mockData.js';
import { formatMoney } from '../../utils/format.js';

// Период графика по умолчанию
const DEFAULT_PERIOD = 'month';

// Секция «Накопительный счёт»: условия и график роста баланса
export default function SavingsSection() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const { navigate } = useAppActions();

  return (
    <section id="savings" className="scroll-mt-20">
      <Container>
        <Reveal>
          <div className="grid gap-8 rounded-panel bg-brand-light/70 p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            {/* Описание счёта */}
            <div className="flex flex-col gap-6 sm:flex-row">
              <IconTile icon={Target} accent="white" size="lg" />
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink">{SAVINGS.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-secondary">{SAVINGS.description}</p>

                <div className="mt-6 grid max-w-sm grid-cols-3 gap-4">
                  {SAVINGS.features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.id}>
                        <Icon className="h-4 w-4 text-ink-secondary" />
                        <p className="mt-2 text-sm font-semibold text-ink">{feature.title}</p>
                        <p className="text-xs text-ink-muted">{feature.caption}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Ведёт на экран «Накопления» в приложении */}
                <Button size="md" pill className="mt-8 px-10" onClick={() => navigate('savings')}>
                  {SAVINGS.depositAction}
                </Button>
              </div>
            </div>

            {/* Баланс и график */}
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-ink-muted">{SAVINGS.balanceLabel}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatMoney(SAVINGS.balance)}</p>
                  <TrendBadge trend={SAVINGS.trend} size="sm" className="mt-2" />
                </div>
                <SegmentedControl id="savings-period" options={SAVINGS_PERIODS} value={period} onChange={setPeriod} />
              </div>
              <BalanceAreaChart data={SAVINGS_HISTORY[period]} className="mt-4 h-56" />
            </Card>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
