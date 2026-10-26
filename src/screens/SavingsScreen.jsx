import { useState } from 'react';
import AccountCard from '../components/savings/AccountCard.jsx';
import AmountDialog from '../components/savings/AmountDialog.jsx';
import BalanceHistoryCard from '../components/savings/BalanceHistoryCard.jsx';
import GoalsListCard from '../components/savings/GoalsListCard.jsx';
import InterestCard from '../components/savings/InterestCard.jsx';
import SavingsHistoryCard from '../components/savings/SavingsHistoryCard.jsx';
import YieldCalculator from '../components/savings/YieldCalculator.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import {
  SAVINGS,
  SAVINGS_HISTORY,
  SAVINGS_PAGE,
  SAVINGS_PERIODS,
  SAVINGS_TX_TYPES,
} from '../data/mockData.js';

/**
 * Экран 3. Накопительный счёт (веб-версия).
 * Пополнение и снятие работают «по-настоящему» внутри прототипа:
 * баланс счёта и история живут в общем состоянии, а перевод
 * сразу отражается в общем балансе и операциях на «Главной».
 */
export default function SavingsScreen() {
  const { savingsBalance: balance, savingsTransactions: transactions, moveSavings, goals, summary } = useFinance();
  const [dialogMode, setDialogMode] = useState(null);

  // Пополнение ограничено деньгами на основном счёте, снятие — балансом накоплений
  const { dialog } = SAVINGS_PAGE;
  const mainBalance = summary.balance.amount;
  const dialogRules = {
    deposit: {
      hint: { label: dialog.availableMain, amount: mainBalance },
      limits: [{ max: mainBalance, error: dialog.errorNoFunds }],
    },
    withdraw: {
      hint: { label: dialog.available, amount: balance },
      limits: [{ max: balance, error: dialog.errorTooMuch }],
    },
  };
  const rules = dialogRules[dialogMode ?? 'deposit'];

  const handleConfirm = (mode, amount) => {
    moveSavings(mode, amount);
    setDialogMode(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <AccountCard
            savings={SAVINGS}
            balance={balance}
            onDeposit={() => setDialogMode('deposit')}
            onWithdraw={() => setDialogMode('withdraw')}
          />
        </Reveal>
        <Reveal delay={0.05}>
          <InterestCard texts={SAVINGS_PAGE.interest} />
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-2">
          <BalanceHistoryCard
            title={SAVINGS_PAGE.chart.title}
            periods={SAVINGS_PERIODS}
            history={SAVINGS_HISTORY}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <YieldCalculator
            startBalance={balance}
            annualRate={SAVINGS_PAGE.annualRate}
            texts={SAVINGS_PAGE.calculator}
            className="h-full"
          />
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-2">
          <SavingsHistoryCard
            transactions={transactions}
            types={SAVINGS_TX_TYPES}
            texts={SAVINGS_PAGE.history}
            className="h-full"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <GoalsListCard goals={goals} texts={SAVINGS_PAGE.goals} className="h-full" />
        </Reveal>
      </div>

      <AmountDialog
        mode={dialogMode}
        hint={rules.hint}
        limits={rules.limits}
        texts={dialog}
        onClose={() => setDialogMode(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
