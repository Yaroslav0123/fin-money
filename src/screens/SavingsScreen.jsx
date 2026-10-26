import { useRef, useState } from 'react';
import AccountCard from '../components/savings/AccountCard.jsx';
import AmountDialog from '../components/savings/AmountDialog.jsx';
import BalanceHistoryCard from '../components/savings/BalanceHistoryCard.jsx';
import GoalsListCard from '../components/savings/GoalsListCard.jsx';
import InterestCard from '../components/savings/InterestCard.jsx';
import SavingsHistoryCard from '../components/savings/SavingsHistoryCard.jsx';
import YieldCalculator from '../components/savings/YieldCalculator.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import {
  GOALS,
  SAVINGS,
  SAVINGS_HISTORY,
  SAVINGS_PAGE,
  SAVINGS_PERIODS,
  SAVINGS_TRANSACTIONS,
  SAVINGS_TX_TYPES,
} from '../data/mockData.js';

/**
 * Экран 3. Накопительный счёт (веб-версия).
 * Пополнение и снятие работают «по-настоящему» внутри прототипа:
 * меняют баланс и добавляют строку в историю (без сохранения на сервер).
 */
export default function SavingsScreen() {
  const [balance, setBalance] = useState(SAVINGS.balance);
  const [transactions, setTransactions] = useState(SAVINGS_TRANSACTIONS);
  const [dialogMode, setDialogMode] = useState(null);
  const nextId = useRef(1);

  const handleConfirm = (mode, amount) => {
    const signedAmount = mode === 'withdraw' ? -amount : amount;
    setBalance((prev) => prev + signedAmount);
    setTransactions((prev) => [
      { id: `new-${nextId.current++}`, type: mode, date: SAVINGS_PAGE.dialog.newTxDate, amount: signedAmount },
      ...prev,
    ]);
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
          <GoalsListCard goals={GOALS} texts={SAVINGS_PAGE.goals} className="h-full" />
        </Reveal>
      </div>

      <AmountDialog
        mode={dialogMode}
        balance={balance}
        texts={SAVINGS_PAGE.dialog}
        onClose={() => setDialogMode(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
