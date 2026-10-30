import { useState } from 'react';
import AccountCard from '../components/savings/AccountCard.jsx';
import AmountDialog from '../components/savings/AmountDialog.jsx';
import BalanceHistoryCard from '../components/savings/BalanceHistoryCard.jsx';
import GoalsListCard from '../components/savings/GoalsListCard.jsx';
import InterestCard from '../components/savings/InterestCard.jsx';
import SavingsHistoryCard from '../components/savings/SavingsHistoryCard.jsx';
import YieldCalculator from '../components/savings/YieldCalculator.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { SAVINGS, SAVINGS_PAGE, SAVINGS_TX_TYPES } from '../data/mockData.js';
import { formatDay, monthName } from '../utils/dates.js';
import { savingsSeries } from '../utils/finance.js';
import { fillTemplate } from '../utils/format.js';

/**
 * Экран 3. Накопительный счёт (веб-версия).
 * Пополнение и снятие работают «по-настоящему» внутри прототипа:
 * перевод сразу отражается в общем балансе и операциях на «Главной».
 * График, проценты и история считаются из операций накопительного счёта.
 */
export default function SavingsScreen() {
  const {
    savings,
    savingsTransactions,
    rawSavingsTransactions,
    savingsOpeningBalance,
    moveSavings,
    goals,
    accounts,
    today,
  } = useFinance();
  const { notify } = useAppActions();
  const [dialogMode, setDialogMode] = useState(null);
  const balance = savings.balance;

  // Пополнение ограничено деньгами на основном счёте, снятие — балансом накоплений
  const { dialog } = SAVINGS_PAGE;
  const mainBalance = accounts[0].balance;
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
    notify(dialog[mode].done);
  };

  // Точки графика для каждого периода переключателя
  const history = Object.fromEntries(
    SAVINGS_PAGE.periods.map((p) => [p.id, savingsSeries(rawSavingsTransactions, savingsOpeningBalance, p.id, today)]),
  );

  const interestTexts = {
    ...SAVINGS_PAGE.interest,
    monthLabel: fillTemplate(SAVINGS_PAGE.interest.monthLabel, { month: monthName(today) }),
    monthAmount: savings.monthInterest,
    totalAmount: savings.totalInterest,
    nextDate: formatDay(savings.nextInterest, today),
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Reveal className="xl:col-span-2">
          <AccountCard
            savings={{ ...SAVINGS, trend: { amount: savings.monthChange, suffix: SAVINGS_PAGE.trendSuffix } }}
            balance={balance}
            onDeposit={() => setDialogMode('deposit')}
            onWithdraw={() => setDialogMode('withdraw')}
          />
        </Reveal>
        <Reveal delay={0.05}>
          <InterestCard texts={interestTexts} />
        </Reveal>

        <Reveal delay={0.1} className="xl:col-span-2">
          <BalanceHistoryCard title={SAVINGS_PAGE.chart.title} periods={SAVINGS_PAGE.periods} history={history} className="h-full" />
        </Reveal>
        <Reveal delay={0.15}>
          <YieldCalculator
            startBalance={balance}
            annualRate={SAVINGS_PAGE.annualRate}
            texts={SAVINGS_PAGE.calculator}
            className="h-full"
          />
        </Reveal>

        <Reveal delay={0.1} className="xl:col-span-2">
          <SavingsHistoryCard
            transactions={savingsTransactions}
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
