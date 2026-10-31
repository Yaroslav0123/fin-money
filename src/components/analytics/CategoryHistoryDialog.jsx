import { ListFilter } from 'lucide-react';
import { SpendingBarChart } from '../charts/lazy.jsx';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { fillTemplate, formatMoney } from '../../utils/format.js';

/**
 * Динамика категории за полгода: столбцы по месяцам, текущий — тёмный, и среднее за полные месяцы.
 * category — категория (с иконкой) или null (окно закрыто); history — результат categoryHistory().
 * onShowTransactions — перейти к операциям категории.
 */
export default function CategoryHistoryDialog({ category, history, texts, onClose, onShowTransactions }) {
  const current = history?.bars.at(-1)?.value ?? 0;

  return (
    <Modal isOpen={Boolean(category)} title={category ? fillTemplate(texts.title, { name: category.name }) : ''} onClose={onClose} closeLabel={texts.close}>
      {category && history && (
        <>
          <div className="flex items-center gap-3">
            <IconTile icon={category.icon} accent={category.accent} />
            <dl className="grid flex-1 grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">{texts.current}</dt>
                <dd className="font-bold text-ink">{formatMoney(current)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">{texts.average}</dt>
                <dd className="font-bold text-ink">{formatMoney(history.average)}</dd>
              </div>
            </dl>
          </div>
          <SpendingBarChart data={history.bars} className="mt-6 h-56" />
          <Button fullWidth size="md" variant="secondary" pill className="mt-6" onClick={onShowTransactions}>
            <ListFilter className="h-4 w-4" />
            {texts.showTransactions}
          </Button>
        </>
      )}
    </Modal>
  );
}
