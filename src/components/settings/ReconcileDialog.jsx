import { useState } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { parseAmount } from '../../utils/csv.js';
import { formatFullDate, fromDateInputValue, toDateInputValue } from '../../utils/dates.js';
import { reconcileAccount } from '../../utils/finance.js';
import { currencySymbol, fillTemplate, formatMoney, formatSignedMoney, fromDisplayAmount, toDisplayAmount } from '../../utils/format.js';

const DISPLAY_PRECISION = 100;
// Сколько подозрительных операций показывать в каждом списке
const LIST_LIMIT = 5;

// Копейки → текст поля в валюте отображения: 4530050 → «45300,5»
const toFieldValue = (kopecks) => String(Math.round(toDisplayAmount(kopecks) * DISPLAY_PRECISION) / DISPLAY_PRECISION).replace('.', ',');

/**
 * Сверка счёта с банком. Пользователь вводит дату и остаток из банка — сразу видно,
 * сходится ли баланс в Fin Money на конец этого дня, а если нет — разница и что проверить:
 * операции ровно на сумму разницы, похожие повторы, последнюю загруженную дату.
 * Если разница была с самого начала, её можно учесть в начальном остатке счёта.
 * «Сохранить сверку» запоминает дату и остаток: итог показывается в карточке «Счета».
 * account — счёт из useFinance().accounts. Монтируется заново для каждого счёта (key у родителя).
 */
export default function ReconcileDialog({ isOpen, account, texts, onClose }) {
  const { rawTransactions, describe, updateAccount } = useFinance();
  const { notify, openTransaction } = useAppActions();
  const saved = account?.reconciliation;
  const [date, setDate] = useState(saved ? toDateInputValue(new Date(saved.date)) : toDateInputValue(new Date()));
  const [rawBank, setRawBank] = useState(saved ? toFieldValue(saved.bankBalance) : '');

  const today = toDateInputValue(new Date());
  const isFuture = date > today;
  const bank = rawBank.trim() ? parseAmount(rawBank) : null;
  const isBankValid = bank !== null;
  const showBankError = rawBank.trim() !== '' && !isBankValid;
  const ready = Boolean(account) && Boolean(date) && !isFuture && isBankValid;
  const day = date ? fromDateInputValue(date) : null;

  const result = ready
    ? reconcileAccount({ account, transactions: rawTransactions, date: day, bankBalance: fromDisplayAmount(bank) })
    : null;

  // Открыть операцию для проверки: окно сверки закрывается, чтобы не стоять под окном операции
  const openTx = (tx) => {
    onClose();
    openTransaction(describe(tx));
  };

  const handleFixOpening = () => {
    updateAccount(account.id, {
      openingBalance: account.openingBalance + result.difference,
      reconciliation: { date: day.toISOString(), bankBalance: fromDisplayAmount(bank) },
    });
    notify(texts.fixed);
    onClose();
  };

  const handleSave = () => {
    updateAccount(account.id, { reconciliation: { date: day.toISOString(), bankBalance: fromDisplayAmount(bank) } });
    notify(texts.saved);
    onClose();
  };

  const fieldClass =
    'mt-2 h-12 w-full rounded-2xl border-2 bg-surface px-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted/70 transition-colors duration-200 focus:bg-card focus:outline-none';

  // Список операций для проверки: название, дата, сумма и кнопка «Открыть»
  const txList = (items) => (
    <ul className="mt-2 space-y-1">
      {items.slice(0, LIST_LIMIT).map((tx) => {
        const view = describe(tx);
        return (
          <li key={tx.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2 text-xs">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{view.title}</span>
              <span className="text-ink-muted">{formatFullDate(new Date(tx.date))}</span>
            </span>
            <span className={`shrink-0 font-semibold ${tx.amount < 0 ? 'text-ink' : 'text-positive'}`}>{formatSignedMoney(tx.amount)}</span>
            <button type="button" onClick={() => openTx(tx)} className="shrink-0 font-semibold text-brand hover:underline">
              {texts.open}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Modal isOpen={isOpen} title={`${texts.title}: ${account?.name ?? ''}`} onClose={onClose} closeLabel={texts.close}>
      <p className="text-sm leading-relaxed text-ink-secondary">{texts.intro}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reconcile-date" className="text-xs font-medium text-ink-muted">
            {texts.dateLabel}
          </label>
          <input
            id="reconcile-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={isFuture}
            className={`${fieldClass} ${isFuture ? 'border-negative' : 'border-transparent focus:border-brand'}`}
          />
          {isFuture && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {texts.futureDate}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="reconcile-bank" className="text-xs font-medium text-ink-muted">
            {texts.bankLabel}, {currencySymbol()}
          </label>
          <input
            id="reconcile-bank"
            autoFocus
            inputMode="decimal"
            value={rawBank}
            onChange={(e) => setRawBank(e.target.value)}
            placeholder="0,00"
            aria-invalid={showBankError}
            className={`${fieldClass} ${showBankError ? 'border-negative' : 'border-transparent focus:border-brand'}`}
          />
          {showBankError && (
            <p className="mt-2 text-xs text-negative" role="alert">
              {texts.bankError}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-5 space-y-4" aria-live="polite">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-surface px-4 py-3">
              <dt className="text-xs text-ink-muted">{texts.appLabel}</dt>
              <dd className="mt-1 font-bold text-ink">{formatMoney(result.appBalance)}</dd>
            </div>
            <div className={`rounded-2xl px-4 py-3 ${result.matches ? 'bg-positive-bg' : 'bg-negative-bg'}`}>
              <dt className="text-xs text-ink-muted">{texts.differenceLabel}</dt>
              <dd className={`mt-1 font-bold ${result.matches ? 'text-positive' : 'text-negative'}`}>
                {result.matches ? formatMoney(0) : formatSignedMoney(result.difference)}
              </dd>
            </div>
          </dl>

          {result.matches ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-positive">
              <CircleCheck className="h-4 w-4 shrink-0" />
              {texts.matches}
            </p>
          ) : (
            <>
              <p className="flex items-start gap-2 text-sm text-ink-secondary">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-negative" />
                {fillTemplate(result.difference > 0 ? texts.bankMore : texts.bankLess, { amount: formatMoney(Math.abs(result.difference)) })}
              </p>
              <div className="space-y-3 text-xs leading-relaxed text-ink-secondary">
                <p className="text-sm font-bold text-ink">{texts.reasonsTitle}</p>
                {result.suspects.length > 0 && (
                  <div>
                    <p>{texts.suspects}</p>
                    {txList(result.suspects)}
                  </div>
                )}
                {result.duplicates.length > 0 && (
                  <div>
                    <p>{texts.duplicates}</p>
                    {txList(result.duplicates.map((group) => group[group.length - 1]))}
                  </div>
                )}
                <p>{result.lastDate ? fillTemplate(texts.lastDate, { date: formatFullDate(result.lastDate) }) : texts.noOperations}</p>
                {result.laterCount > 0 && <p>{fillTemplate(texts.later, { count: result.laterCount })}</p>}
                <p>{texts.opening}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <Button size="md" disabled={!ready} onClick={handleSave} className="flex-1 disabled:opacity-40 disabled:shadow-none">
          {texts.save}
        </Button>
        {result && !result.matches && (
          <Button size="md" variant="secondary" onClick={handleFixOpening} className="flex-1">
            {texts.fixOpening}
          </Button>
        )}
      </div>
    </Modal>
  );
}
