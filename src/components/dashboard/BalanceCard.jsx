import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Eye, EyeOff, Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import { formatMoney } from '../../utils/format.js';

/**
 * Главная карточка «Общий баланс» с возможностью скрыть сумму
 * и быстрыми действиями «Пополнить» / «Перевести».
 * hiddenByDefault — сумма скрыта при открытии (настройка «Скрывать баланс»),
 * глазом её можно показать до ухода с экрана.
 */
export default function BalanceCard({ balance, texts, hiddenByDefault = false, onDeposit }) {
  const [isHidden, setIsHidden] = useState(hiddenByDefault);
  const EyeIcon = isHidden ? EyeOff : Eye;

  return (
    <Card className="relative flex h-full flex-col justify-between gap-8 overflow-hidden p-6 sm:p-8">
      {/* Декоративные круги в фирменных оттенках */}
      <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-light" />
      <span className="pointer-events-none absolute -right-4 top-24 h-40 w-40 rounded-full bg-brand-soft/60" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          {balance.label}
          <button
            type="button"
            onClick={() => setIsHidden((v) => !v)}
            aria-label={isHidden ? texts.showBalanceLabel : texts.hideBalanceLabel}
            className="rounded-full p-1 transition-colors duration-200 hover:bg-black/5 hover:text-ink"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Сумма плавно сменяется при скрытии/показе */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={isHidden ? 'hidden' : 'shown'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl"
          >
            {isHidden ? texts.hiddenAmount : formatMoney(balance.amount)}
          </motion.p>
        </AnimatePresence>

        <TrendBadge trend={balance.trend} className="mt-4" />
      </div>

      <div className="relative flex flex-wrap gap-3">
        <Button size="md" pill onClick={onDeposit}>
          <Plus className="h-4 w-4" />
          {texts.actions.deposit}
        </Button>
        <Button size="md" variant="secondary" pill>
          <ArrowLeftRight className="h-4 w-4" />
          {texts.actions.transfer}
        </Button>
      </div>
    </Card>
  );
}
