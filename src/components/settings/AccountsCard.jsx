import { useState } from 'react';
import { Landmark, Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import AccountDialog from './AccountDialog.jsx';
import ReconcileDialog from './ReconcileDialog.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import IconTile from '../ui/IconTile.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { formatFullDate } from '../../utils/dates.js';
import { reconcileAccount } from '../../utils/finance.js';
import { fillTemplate, formatMoney, plural } from '../../utils/format.js';

// Итог сохранённой сверки, пересчитанный по текущим операциям: правки после сверки сразу видны
const reconciledLabel = (account, transactions, texts) => {
  const saved = account.reconciliation;
  if (!saved) return null;
  const date = new Date(saved.date);
  const { difference } = reconcileAccount({ account, transactions, date, bankBalance: saved.bankBalance });
  return difference === 0
    ? { text: fillTemplate(texts.reconciledOk, { date: formatFullDate(date) }), ok: true }
    : { text: fillTemplate(texts.reconciledDiff, { date: formatFullDate(date), amount: formatMoney(Math.abs(difference)) }), ok: false };
};

/**
 * Карточка «Счета»: карты, наличные и другие счета с текущим балансом.
 * Счёт можно добавить, переименовать, поменять начальный остаток и удалить вместе с его операциями.
 * Основной (первый) счёт не удаляется: на него попадают операции, добавленные вручную.
 * «Сверить с банком» сравнивает баланс с остатком в банке (ReconcileDialog); итог последней сверки — под названием.
 */
export default function AccountsCard({ texts, className = '' }) {
  const { accounts, rawTransactions, addAccount, updateAccount, deleteAccount } = useFinance();
  const { notify } = useAppActions();
  // null — закрыт, { account: null } — новый, { account } — изменение
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  // Сверяемый счёт остаётся после закрытия, чтобы окно доиграло анимацию; key — новое окно на каждое открытие
  const [reconcile, setReconcile] = useState({ account: null, isOpen: false, key: 0 });

  const handleSave = (draft) => {
    if (dialog.account) {
      updateAccount(dialog.account.id, draft);
      notify(texts.saved);
    } else {
      addAccount(draft);
      notify(texts.added);
    }
    setDialog(null);
  };

  const handleDelete = () => {
    deleteAccount(deleting.id);
    setDeleting(null);
    notify(texts.deleted);
  };

  const iconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <Button size="sm" pill onClick={() => setDialog({ account: null })} className="h-9 shrink-0 px-4">
          <Plus className="h-4 w-4" />
          {texts.add}
        </Button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{texts.description}</p>

      <ul className="mt-4 divide-y divide-line">
        {accounts.map((account) => {
          const reconciled = reconciledLabel(account, rawTransactions, texts);
          return (
            <li key={account.id} className="flex items-center gap-3 py-3">
              <IconTile icon={Landmark} accent={account.isPrimary ? 'brand' : 'blue'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="truncate">{account.name}</span>
                  {account.isPrimary && (
                    <span title={texts.primaryHint} className="shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                      {texts.primary}
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-muted">
                  {account.count} {plural(account.count, texts.count)}
                </p>
                {reconciled && <p className={`text-xs font-medium ${reconciled.ok ? 'text-positive' : 'text-negative'}`}>{reconciled.text}</p>}
              </div>
              <span className={`shrink-0 text-sm font-bold ${account.balance < 0 ? 'text-negative' : 'text-ink'}`}>{formatMoney(account.balance)}</span>
              <button
                type="button"
                aria-label={fillTemplate(texts.reconcileLabel, { name: account.name })}
                title={texts.reconcile}
                onClick={() => setReconcile((prev) => ({ account, isOpen: true, key: prev.key + 1 }))}
                className={iconButtonClass}
              >
                <Scale className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={fillTemplate(texts.edit, { name: account.name })}
                onClick={() => setDialog({ account })}
                className={iconButtonClass}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={fillTemplate(texts.delete, { name: account.name })}
                title={account.isPrimary ? texts.primaryHint : undefined}
                disabled={account.isPrimary}
                onClick={() => setDeleting(account)}
                className={`${iconButtonClass} hover:bg-negative-bg hover:text-negative`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <AccountDialog
        key={dialog?.account?.id ?? 'new'}
        isOpen={Boolean(dialog)}
        account={dialog?.account ?? null}
        texts={texts.dialog}
        onClose={() => setDialog(null)}
        onSave={handleSave}
      />
      <ReconcileDialog
        key={reconcile.key}
        isOpen={reconcile.isOpen}
        account={accounts.find((a) => a.id === reconcile.account?.id) ?? reconcile.account}
        texts={texts.reconcileDialog}
        onClose={() => setReconcile((prev) => ({ ...prev, isOpen: false }))}
      />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={deleting ? fillTemplate(texts.deleteQuestion, { name: deleting.name }) : ''}
        text={deleting ? fillTemplate(texts.deleteText, { count: deleting.count }) : ''}
        confirmLabel={texts.deleteConfirm}
        cancelLabel={texts.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}
