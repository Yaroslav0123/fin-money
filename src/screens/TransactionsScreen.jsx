import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { TransactionRow } from '../components/dashboard/TransactionsCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { TRANSACTIONS_PAGE } from '../data/mockData.js';
import { formatGroupDate, startOfDay } from '../utils/dates.js';
import { formatMoney } from '../utils/format.js';

const ALL = 'all';

// Совпадение с поиском: заголовок, категория или комментарий без учёта регистра
const matchesQuery = (tx, query) =>
  !query || [tx.title, tx.category, tx.comment].some((field) => field?.toLowerCase().includes(query));

/**
 * Экран «Операции»: вся история основного счёта с поиском и фильтрами.
 * Операции сгруппированы по дням; по нажатию открываются на изменение или удаление.
 * params — начальные условия: { query } из поиска в шапке, { categoryId } или { type }
 * из «Аналитики».
 */
export default function TransactionsScreen({ params = {} }) {
  const { transactions, categories, today } = useFinance();
  const { openTransaction, openAddTransaction } = useAppActions();
  const t = TRANSACTIONS_PAGE;

  const [query, setQuery] = useState(params.query ?? '');
  const [type, setType] = useState(params.type ?? (params.categoryId ? 'expense' : ALL));
  const [categoryId, setCategoryId] = useState(params.categoryId ?? ALL);
  const [visibleCount, setVisibleCount] = useState(t.pageSize);

  // Категории для выпадающего списка — того же типа, что выбран фильтром
  const categoryOptions = categories.filter((c) => type === ALL || c.type === type);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter(
      (tx) =>
        (type === ALL || tx.type === type) &&
        (categoryId === ALL || tx.categoryId === categoryId) &&
        matchesQuery(tx, normalized),
    );
  }, [transactions, query, type, categoryId]);

  const income = filtered.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = filtered.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum - tx.amount, 0);

  // Группы по дням для видимой части списка
  const groups = [];
  filtered.slice(0, visibleCount).forEach((tx) => {
    const day = startOfDay(new Date(tx.date)).getTime();
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(tx);
    else groups.push({ day, label: formatGroupDate(new Date(day), today), items: [tx] });
  });

  const hasFilters = query || type !== ALL || categoryId !== ALL;
  const resetFilters = () => {
    setQuery('');
    setType(ALL);
    setCategoryId(ALL);
  };

  const handleTypeChange = (nextType) => {
    setType(nextType);
    // Категория другого типа больше не подходит
    if (categoryId !== ALL && categories.find((c) => c.id === categoryId)?.type !== nextType) setCategoryId(ALL);
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Поиск и фильтры */}
      <Reveal>
        <Card className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t.searchPlaceholder}
              placeholder={t.searchPlaceholder}
              className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl id="transactions-type" options={t.filters} value={type} onChange={handleTypeChange} />
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label={t.categoryLabel}
                className="h-10 max-w-[12rem] cursor-pointer appearance-none truncate rounded-full bg-surface pl-4 pr-9 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value={ALL}>{t.allCategories}</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand"
              >
                <X className="h-3.5 w-3.5" />
                {t.resetFilters}
              </button>
            )}
          </div>
        </Card>
      </Reveal>

      {/* Итоги по найденным операциям */}
      <Reveal delay={0.05} className="grid grid-cols-3 gap-3 sm:gap-5">
        {[
          { id: 'count', label: t.totals.count, value: String(filtered.length) },
          { id: 'income', label: t.totals.income, value: formatMoney(income), tone: 'text-positive' },
          { id: 'expenses', label: t.totals.expenses, value: formatMoney(expenses) },
        ].map((item) => (
          <Card key={item.id} className="min-w-0 px-3 py-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">{item.label}</p>
            <p className={`mt-1 truncate text-[13px] font-bold tracking-tight sm:text-xl ${item.tone ?? 'text-ink'}`}>{item.value}</p>
          </Card>
        ))}
      </Reveal>

      {/* Список по дням */}
      <Reveal delay={0.1}>
        <Card className="p-4 sm:p-6">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-sm text-ink-muted">{t.emptyAll}</p>
              <Button size="sm" pill onClick={openAddTransaction}>
                <Plus className="h-4 w-4" />
                {t.addFirst}
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-muted">{t.empty}</p>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.day}>
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.label}</h3>
                  <ul className="-mx-2 mt-1 grid grid-cols-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {group.items.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} onSelect={openTransaction} showDate={false} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
              {filtered.length > visibleCount && (
                <Button variant="secondary" size="md" fullWidth onClick={() => setVisibleCount((n) => n + t.pageSize)}>
                  {t.showMore}
                </Button>
              )}
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
