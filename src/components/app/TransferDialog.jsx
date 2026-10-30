import { useState } from 'react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { TRANSFER_DETAILS } from '../../data/mockData.js';
import { formatSignedMoney } from '../../utils/format.js';

/**
 * Карточка перевода (на накопления, в цель или обратно).
 * Перевод нельзя изменить, но можно удалить — тогда деньги вернутся на прежнее место.
 * transaction — перевод в виде для списков (title, icon, dateLabel…), null — диалог закрыт.
 */
export default function TransferDialog({ transaction, onClose, onDone }) {
  const { deleteTransaction } = useFinance();
  const [isConfirming, setIsConfirming] = useState(false);
  const t = TRANSFER_DETAILS;
  // Перевод из выписки ни с чем в Fin Money не связан: удаляется без возврата денег
  const isImported = transaction?.kind === 'import';
  const deleteQuestion = isImported ? t.importDeleteQuestion : t.deleteQuestion;

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
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">{isImported ? t.importNote : t.note}</p>

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
