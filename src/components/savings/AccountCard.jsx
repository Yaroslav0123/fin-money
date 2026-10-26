import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Target } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import { formatMoney } from '../../utils/format.js';

/**
 * Главная карточка счёта: описание и условия слева,
 * текущий баланс с кнопками «Пополнить» / «Снять» справа.
 */
export default function AccountCard({ savings, balance, onDeposit, onWithdraw }) {
  return (
    <Card className="grid h-full gap-6 p-6 sm:p-8 md:grid-cols-[1fr_1fr]">
      {/* Описание счёта */}
      <div>
        <IconTile icon={Target} accent="brand" size="lg" />
        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">{savings.title}</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-secondary">{savings.description}</p>

        <div className="mt-6 grid max-w-sm grid-cols-3 gap-4">
          {savings.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink-secondary">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-sm font-semibold text-ink">{feature.title}</p>
                <p className="text-xs text-ink-muted">{feature.caption}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Баланс и действия */}
      <div className="flex flex-col justify-between gap-6 rounded-card bg-brand-light/70 p-6">
        <div>
          <p className="text-xs font-medium text-ink-muted">{savings.balanceLabel}</p>
          {/* Сумма мягко «перещёлкивается» при изменении */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={balance}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-1 text-4xl font-extrabold tracking-tight text-ink"
            >
              {formatMoney(balance)}
            </motion.p>
          </AnimatePresence>
          <TrendBadge trend={savings.trend} className="mt-3" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
          <Button size="md" onClick={onDeposit}>
            <Plus className="h-4 w-4" />
            {savings.depositAction}
          </Button>
          <Button size="md" variant="secondary" className="bg-white hover:bg-white/70" onClick={onWithdraw}>
            <Minus className="h-4 w-4" />
            {savings.withdrawAction}
          </Button>
        </div>
      </div>
    </Card>
  );
}
