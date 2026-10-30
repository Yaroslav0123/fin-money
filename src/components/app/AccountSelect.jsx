import { ACCOUNT_SELECT } from '../../data/mockData.js';

/**
 * Выбор счёта: в окне операции, при импорте выписки и в фильтре «Операций».
 * accounts — счета из FinanceContext; value — id счёта (или '' для «все счета», если withAll);
 * onChange(id). Когда счёт один, выбирать не из чего — родитель обычно не показывает список.
 */
export default function AccountSelect({ id, accounts, value, onChange, label = ACCOUNT_SELECT.label, withAll = false, className = '' }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={id ? undefined : label}
      className={`cursor-pointer truncate rounded-2xl bg-surface px-4 text-sm font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
    >
      {withAll && <option value="">{ACCOUNT_SELECT.all}</option>}
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}
