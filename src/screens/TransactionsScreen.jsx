import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Plus, ReceiptText, Search, SearchX, Sparkles, Upload, X } from 'lucide-react';
import AccountSelect from '../components/app/AccountSelect.jsx';
import SortOtherDialog from '../components/app/SortOtherDialog.jsx';
import { TransactionRow } from '../components/dashboard/TransactionsCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { CSV_TEXTS, SORT_OTHER_DIALOG, TRANSACTIONS_PAGE } from '../data/mockData.js';
import { toCsv } from '../utils/csv.js';
import { formatGroupDate, startOfDay, toDateInputValue } from '../utils/dates.js';
import { downloadFile } from '../utils/download.js';
import { fillTemplate, formatMoney } from '../utils/format.js';
import { transactionsToRows, uncategorizedGroups } from '../utils/statement.js';

const ALL = 'all';

// Совпадение с поиском: заголовок, категория или комментарий без учёта регистра
const matchesQuery = (tx, query) =>
  !query || [tx.title, tx.category, tx.comment].some((field) => field?.toLowerCase().includes(query));

/**
 * Экран «Операции»: вся история счетов с поиском и фильтрами (по счёту — если счетов несколько).
 * Операции сгруппированы по дням; по нажатию открываются на изменение или удаление.
 * params — начальные условия: { query } из поиска в шапке, { categoryId } или { type }
 * из «Аналитики», { sort: true } — сразу открыть разбор «Другого» (из отчёта после импорта).
 */
export default function TransactionsScreen({ params = {} }) {
  const { transactions, categories, accounts, today } = useFinance();
  const { openTransaction, openAddTransaction, openImport, notify } = useAppActions();
  const [isSortOpen, setIsSortOpen] = useState(Boolean(params.sort));
  const t = TRANSACTIONS_PAGE;

  // Импортированные операции без своей категории — для «Разобрать „Другое“»
  const otherGroups = useMemo(() => uncategorizedGroups(transactions, categories), [transactions, categories]);
  const otherCount = otherGroups.reduce((sum, group) => sum + group.ids.length, 0);

  const [query, setQuery] = useState(params.query ?? '');
  const [type, setType] = useState(params.type ?? (params.categoryId ? 'expense' : ALL));
  const [categoryId, setCategoryId] = useState(params.categoryId ?? ALL);
  // '' — все счета
  const [accountId, setAccountId] = useState('');
  const [visibleCount, setVisibleCount] = useState(t.pageSize);

  // Категории для выпадающего списка — того же типа, что выбран фильтром
  const categoryOptions = categories.filter((c) => type === ALL || c.type === type);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter(
      (tx) =>
        (type === ALL || tx.type === type) &&
        (categoryId === ALL || tx.categoryId === categoryId) &&
        (!accountId || tx.accountId === accountId) &&
        matchesQuery(tx, normalized),
    );
  }, [transactions, query, type, categoryId, accountId]);

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

  const hasFilters = query || type !== ALL || categoryId !== ALL || accountId;
  const resetFilters = () => {
    setQuery('');
    setType(ALL);
    setCategoryId(ALL);
    setAccountId('');
  };

  // Выгрузка найденных операций (с учётом поиска и фильтров) в CSV для Excel
  const handleExport = () => {
    downloadFile(toCsv(transactionsToRows(filtered)), `${CSV_TEXTS.fileName}-${toDateInputValue(today)}.csv`);
    notify(t.exported);
  };

  const handleTypeChange = (nextType) => {
    setType(nextType);
    // Категория другого типа больше не подходит
    if (categoryId !== ALL && categories.find((c) => c.id === categoryId)?.type !== nextType) setCategoryId(ALL);
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Импорт выписки и выгрузка */}
      <Reveal className="flex flex-wrap justify-end gap-2">
        {otherCount > 0 && (
          <Button size="sm" pill variant="secondary" onClick={() => setIsSortOpen(true)}>
            <Sparkles className="h-4 w-4" />
            {t.sortAction} ({otherCount})
          </Button>
        )}
        <Button size="sm" pill variant="secondary" onClick={() => openImport()}>
          <Upload className="h-4 w-4" />
          {t.importAction}
        </Button>
        <Button size="sm" pill variant="secondary" onClick={handleExport} disabled={filtered.length === 0} className="disabled:opacity-40">
          <Download className="h-4 w-4" />
          {t.exportAction}
        </Button>
      </Reveal>

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
            {accounts.length > 1 && (
              <div className="relative">
                <AccountSelect
                  accounts={accounts}
                  value={accountId}
                  onChange={setAccountId}
                  withAll
                  className="h-10 max-w-[12rem] appearance-none rounded-full pl-4 pr-9 text-xs"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              </div>
            )}
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
            <EmptyState
              icon={ReceiptText}
              text={t.emptyAll}
              className="py-12"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" pill onClick={() => openImport()}>
                    <Upload className="h-4 w-4" />
                    {t.importAction}
                  </Button>
                  <Button size="sm" pill variant="secondary" onClick={openAddTransaction}>
                    <Plus className="h-4 w-4" />
                    {t.addFirst}
                  </Button>
                </div>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={SearchX} text={t.empty} className="py-12" />
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

      <SortOtherDialog
        isOpen={isSortOpen}
        groups={otherGroups}
        onClose={() => setIsSortOpen(false)}
        onDone={(count) => {
          setIsSortOpen(false);
          notify(fillTemplate(SORT_OTHER_DIALOG.done, { count }));
        }}
      />
    </div>
  );
}
