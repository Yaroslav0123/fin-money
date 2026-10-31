import { useState } from 'react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { TRANSFER_DETAILS } from '../../data/mockData.js';
import { fillTemplate, formatSignedMoney } from '../../utils/format.js';
import { isGoalDone } from '../../utils/finance.js';

/**
 * Карточка перевода между своими счетами из выписки. Перевод нельзя изменить, но можно удалить.
 * Исходящий перевод (на вклад, в копилку) можно засчитать в цель: цель растёт, баланс не меняется.
 * transaction — перевод в виде для списков (title, icon, dateLabel, goalId…), null — диалог закрыт.
 */
export default function TransferDialog({ transaction, onClose, onDone }) {
  const { deleteTransaction, assignTransferToGoal, goals } = useFinance();
  const [isConfirming, setIsConfirming] = useState(false);
  const t = TRANSFER_DETAILS;
  const deleteQuestion = t.deleteQuestion;
  // В цель засчитываются только списания; в списке — незавершённые цели и та, куда перевод уже засчитан
  const canAssign = transaction?.amount < 0 && goals.length > 0;
  const goalOptions = goals.filter((g) => !isGoalDone(g) || g.id === transaction?.goalId);

  const handleAssign = (goalId) => {
    assignTransferToGoal(transaction.id, goalId || null);
    const goal = goals.find((g) => g.id === goalId);
    onDone(goal ? fillTemplate(t.goalAssigned, { name: goal.name }) : t.goalRemoved);
  };

  const handleClose = () => {
    setIsConfirming(false);
    onClose();
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setIsConfirming(false);
    onDone(t.deleted);
  };

  return (
    <Modal isOpen={Boolean(transaction)} title={t.title} onClose={handleClose} closeLabel={t.close}>
      {transaction && (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
            <IconTile icon={transaction.icon} accent={transaction.accent} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{transaction.title}</p>
              <p className="text-xs text-ink-muted">{transaction.dateLabel}</p>
            </div>
            <span className="shrink-0 text-base font-bold text-ink">{formatSignedMoney(transaction.amount)}</span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">{t.note}</p>

          {canAssign && (
            <div className="mt-5">
              <label htmlFor="transfer-goal" className="text-xs font-medium text-ink-muted">
                {t.goalLabel}
              </label>
              <select
                id="transfer-goal"
                value={transaction.goalId ?? ''}
                onChange={(e) => handleAssign(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border-2 border-transparent bg-surface px-4 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
              >
                <option value="">{t.noGoal}</option>
                {goalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">{t.goalHint}</p>
            </div>
          )}

          {isConfirming ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-negative-bg px-4 py-3" role="group" aria-label={deleteQuestion}>
              <span className="text-sm font-semibold text-negative">{deleteQuestion}</span>
              <div className="flex gap-2">
                <Button size="sm" pill variant="secondary" onClick={() => setIsConfirming(false)}>
                  {t.close}
                </Button>
                <Button size="sm" pill className="bg-negative shadow-none hover:bg-negative/90" onClick={handleDelete}>
                  {t.delete}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" size="md" className="bg-negative-bg text-negative hover:bg-negative/15" onClick={() => setIsConfirming(true)}>
                {t.delete}
              </Button>
              <Button size="md" onClick={handleClose}>
                {t.close}
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
