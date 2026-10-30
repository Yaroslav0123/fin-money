import { BellOff, Target, TriangleAlert, Wallet } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { APP_SHELL } from '../../data/mockData.js';
import { fillTemplate, formatMoney } from '../../utils/format.js';

// Вид уведомления по его типу: иконка, цвет и текст
const describe = (item, describeTx) => {
  const t = APP_SHELL.notifications;
  if (item.kind === 'budget') return { icon: Wallet, accent: 'pink', text: fillTemplate(t.budget, { percent: item.percent }) };
  if (item.kind === 'categoryBudget') {
    const { budget } = item;
    const text =
      budget.status === 'over'
        ? fillTemplate(t.categoryOver, { name: budget.name, over: formatMoney(-budget.left) })
        : fillTemplate(t.categoryWarning, { name: budget.name, percent: budget.percent, left: formatMoney(budget.left) });
    return { icon: budget.icon, accent: budget.status === 'over' ? 'pink' : 'orange', text };
  }
  if (item.kind === 'goal') {
    const text = item.days === 0 ? t.goalToday : t.goal;
    return { icon: Target, accent: 'blue', text: fillTemplate(text, { name: item.goal.name, days: item.days }) };
  }
  const tx = describeTx(item.transaction);
  return { icon: TriangleAlert, accent: 'orange', text: fillTemplate(t.large, { title: tx.title, amount: formatMoney(-tx.amount) }), tx };
};

/**
 * Панель уведомлений под колокольчиком. Список собирается из данных
 * (см. notificationData): бюджет, лимиты категорий, сроки целей, крупные траты за неделю.
 * Крупную трату можно открыть и, например, исправить.
 */
export default function NotificationsDialog({ isOpen, items, onClose }) {
  const { describe: describeTx } = useFinance();
  const { openTransaction } = useAppActions();
  const t = APP_SHELL.notifications;

  return (
    <Modal isOpen={isOpen} title={t.title} onClose={onClose} closeLabel={t.close}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-ink-muted">
          <BellOff className="h-8 w-8 text-ink-muted/60" />
          {t.empty}
        </div>
      ) : (
        <ul className="-mx-2 space-y-1">
          {items.map((item) => {
            const view = describe(item, describeTx);
            const content = (
              <>
                <IconTile icon={view.icon} accent={view.accent} size="sm" />
                <span className="pt-1 text-sm leading-relaxed text-ink-secondary">{view.text}</span>
              </>
            );
            return (
              <li key={item.id}>
                {view.tx ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openTransaction(view.tx);
                    }}
                    className="flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors duration-200 hover:bg-surface"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-start gap-3 px-2 py-2.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Button size="md" variant="secondary" fullWidth className="mt-6" onClick={onClose}>
        {t.close}
      </Button>
    </Modal>
  );
}
