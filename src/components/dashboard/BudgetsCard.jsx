import { Gauge, Plus } from 'lucide-react';
import BudgetMeter from '../budgets/BudgetMeter.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { CATEGORY_BUDGETS } from '../../data/mockData.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * «Бюджеты по категориям» на «Главной»: траты текущего месяца против лимитов.
 * Показываются самые заполненные (texts.limit, budgets уже отсортированы по проценту), остальные — по ссылке в «Настройки».
 * Без лимитов — подсказка и кнопка, которая ведёт в «Настройки» (onSetup).
 */
export default function BudgetsCard({ budgets, month, texts, onSetup, className = '' }) {
  const t = CATEGORY_BUDGETS;
  const shown = budgets.slice(0, texts.limit);
  const hasMore = budgets.length > shown.length;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">{t.title}</h3>
          <p className="text-xs text-ink-muted">{fillTemplate(texts.caption, { month })}</p>
        </div>
        {budgets.length > 0 && (
          <LinkArrow to="settings" params={{ section: 'money' }}>
            {hasMore ? fillTemplate(texts.more, { count: budgets.length }) : texts.settingsLink}
          </LinkArrow>
        )}
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Gauge}
          text={t.empty}
          compact
          action={
            <Button size="sm" pill onClick={onSetup} className="shrink-0">
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((budget) => (
            <li key={budget.id}>
              <BudgetMeter budget={budget} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
