import { Plus } from 'lucide-react';
import BudgetMeter from '../budgets/BudgetMeter.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import LinkArrow from '../ui/LinkArrow.jsx';
import { CATEGORY_BUDGETS } from '../../data/mockData.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * «Бюджеты по категориям» на «Главной»: траты текущего месяца против лимитов.
 * Без лимитов — подсказка и кнопка, которая ведёт в «Настройки» (onSetup).
 */
export default function BudgetsCard({ budgets, month, texts, onSetup, className = '' }) {
  const t = CATEGORY_BUDGETS;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">{t.title}</h3>
          <p className="text-xs text-ink-muted">{fillTemplate(texts.caption, { month })}</p>
        </div>
        {budgets.length > 0 && <LinkArrow to="settings">{texts.settingsLink}</LinkArrow>}
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="max-w-md text-sm text-ink-muted">{t.empty}</p>
          <Button size="sm" pill onClick={onSetup}>
            <Plus className="h-4 w-4" />
            {t.add}
          </Button>
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <li key={budget.id}>
              <BudgetMeter budget={budget} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
