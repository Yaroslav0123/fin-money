import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, FileUp, Plus } from 'lucide-react';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import { currencySymbol } from '../../utils/format.js';

/**
 * Главная карточка «Общий баланс» с возможностью скрыть сумму
 * и быстрыми действиями «Загрузить выписку» / «Добавить операцию».
 * hiddenByDefault — сумма скрыта при открытии (настройка «Скрывать баланс»),
 * глазом её можно показать до ухода с экрана.
 * onImport / onAdd — нажатия на кнопки быстрых действий.
 * accounts — счета с балансами: если их больше одного, под суммой видно, сколько на каждом.
 */
export default function BalanceCard({ balance, accounts = [], texts, hiddenByDefault = false, onImport, onAdd }) {
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
            className="rounded-full p-1 transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
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
            {isHidden ? `${texts.hiddenAmount} ${currencySymbol()}` : <AnimatedMoney value={balance.amount} />}
          </motion.p>
        </AnimatePresence>

        <TrendBadge trend={balance.trend} className="mt-4" />

        {accounts.length > 1 && (
          <dl aria-label={texts.accountsLabel} className="mt-5 grid max-w-sm gap-1.5 text-sm">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-baseline justify-between gap-3">
                <dt className="truncate text-ink-muted">{account.name}</dt>
                <dd className="shrink-0 font-semibold text-ink">
                  {isHidden ? `${texts.hiddenAmount} ${currencySymbol()}` : <AnimatedMoney value={account.balance} />}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="relative flex flex-wrap gap-3">
        <Button size="md" pill onClick={onImport}>
          <FileUp className="h-4 w-4" />
          {texts.actions.import}
        </Button>
        <Button size="md" variant="secondary" pill onClick={onAdd}>
          <Plus className="h-4 w-4" />
          {texts.actions.add}
        </Button>
      </div>
    </Card>
  );
}
