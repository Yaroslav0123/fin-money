import { Trash2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { fillTemplate } from '../../utils/format.js';

/**
 * Карточка «Правила категорий»: что запомнено при импорте и разборе «Другого»
 * («KOFEYNYA ZERNO…» → «Еда»). Правило можно удалить — следующие выписки разберутся по словарю.
 * rules — [{ key, label, categoryName }]; onDelete(key).
 */
export default function CategoryRulesCard({ texts, rules, onDelete, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{texts.description}</p>

      {rules.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface px-4 py-3 text-sm text-ink-secondary">{texts.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rules.map((rule) => (
            <li key={rule.key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{rule.label || rule.key}</p>
                <p className="truncate text-xs text-ink-muted">→ {rule.categoryName}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(rule.key)}
                aria-label={fillTemplate(texts.deleteLabel, { name: rule.label || rule.key })}
                className="rounded-full p-2 text-ink-muted transition-colors duration-200 hover:bg-negative-bg hover:text-negative"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
