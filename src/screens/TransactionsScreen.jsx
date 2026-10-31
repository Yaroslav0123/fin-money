import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Plus, ReceiptText, Search, SearchX, SlidersHorizontal, Sparkles, Upload, X } from 'lucide-react';
import AccountSelect from '../components/app/AccountSelect.jsx';
import SortOtherDialog from '../components/app/SortOtherDialog.jsx';
import { TransactionRow } from '../components/dashboard/TransactionsCard.jsx';
import AnimatedMoney from '../components/ui/AnimatedMoney.jsx';
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
import { historyRange, isInHistoryRange } from '../utils/finance.js';
import { fillTemplate, formatSignedMoney } from '../utils/format.js';
import { transactionsToRows, uncategorizedGroups } from '../utils/statement.js';

const ALL = 'all';

// Совпадение с поиском: заголовок, категория или комментарий без учёта регистра
const matchesQuery = (tx, query) =>
  !query || [tx.title, tx.category, tx.comment].some((field) => field?.toLowerCase().includes(query));

// Общий вид выпадающих списков и полей дат в фильтрах
const selectClass =
  'h-10 max-w-[12rem] cursor-pointer appearance-none truncate rounded-full bg-surface pl-4 pr-9 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
const dateInputClass =
  'h-10 rounded-full bg-surface px-3 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

// Итог дня в заголовке группы: «+50 000 ₽ · −3 420 ₽». Без доходов и расходов (только переводы) — пусто.
function DayTotal({ total }) {
  if (!total) return null;
  const t = TRANSACTIONS_PAGE.dayTotal;
  return (
    <span className="shrink-0 whitespace-nowrap">
      {total.income > 0 && (
        <span className="text-positive">
          <span className="sr-only">{t.income} </span>
          {formatSignedMoney(total.income)}
        </span>
      )}
      {total.income > 0 && total.expenses < 0 && ' · '}
      {total.expenses < 0 && (
        <span className="text-ink-secondary">
          <span className="sr-only">{t.expenses} </span>
          {formatSignedMoney(total.expenses)}
        </span>
      )}
    </span>
  );
}

/**
 * Экран «Операции»: вся история счетов с поиском и фильтрами (по счёту — если счетов несколько).
 * Операции сгруппированы по дням, у каждого дня — итог прихода и расхода; по нажатию открываются на изменение или удаление.
 * У операций из выписки — значок файла, а оставшиеся в «Другом» помечены «Разобрать».
 * На телефоне строка поиска прилипает к шапке при прокрутке, а остальные фильтры свёрнуты под кнопку.
 * params — начальные условия: { query } из поиска в шапке, { categoryId }, { type } или { period, from, to }
 * из «Аналитики» (день календаря трат — period: 'custom' с одинаковыми from и to), { sort: true } — сразу открыть разбор «Другого» (из отчёта после импорта).
 */
export default function TransactionsScreen({ params = {} }) {
  const { transactions, categories, accounts, imports, today } = useFinance();
  const { openTransaction, openAddTransaction, openImport, notify } = useAppActions();
  const [isSortOpen, setIsSortOpen] = useState(Boolean(params.sort));
  const t = TRANSACTIONS_PAGE;

  // Импортированные операции без своей категории — для «Разобрать „Другое“»
  const otherGroups = useMemo(() => uncategorizedGroups(transactions, categories), [transactions, categories]);
  const otherCount = otherGroups.reduce((sum, group) => sum + group.ids.length, 0);
  const needsSortIds = useMemo(() => new Set(otherGroups.flatMap((group) => group.ids)), [otherGroups]);
  // Имя файла выписки для значка у импортированных операций
  const importFile = useMemo(() => Object.fromEntries(imports.map((item) => [item.id, item.fileName])), [imports]);

  const [query, setQuery] = useState(params.query ?? '');
  const [type, setType] = useState(params.type ?? (params.categoryId ? 'expense' : ALL));
  const [categoryId, setCategoryId] = useState(params.categoryId ?? ALL);
  // '' — все счета
  const [accountId, setAccountId] = useState('');
  const [period, setPeriod] = useState(params.period ?? ALL);
  // Свой период: даты в формате <input type="date">
  const [custom, setCustom] = useState({ from: params.from ?? '', to: params.to ?? '' });
  // На телефоне фильтры свёрнуты; на широком экране видны всегда
  const [isFiltersOpen, setIsFiltersOpen] = useState(Boolean(params.period));
  const [visibleCount, setVisibleCount] = useState(t.pageSize);

  // Категории для выпадающего списка — того же типа, что выбран фильтром
  const categoryOptions = categories.filter((c) => type === ALL || c.type === type);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const range = historyRange(period, today, custom);
    return transactions.filter(
      (tx) =>
        (type === ALL || tx.type === type) &&
        (categoryId === ALL || tx.categoryId === categoryId) &&
        (!accountId || tx.accountId === accountId) &&
        isInHistoryRange(tx, range) &&
        matchesQuery(tx, normalized),
    );
  }, [transactions, query, type, categoryId, accountId, period, custom, today]);

  const income = filtered.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = filtered.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum - tx.amount, 0);

  // Итоги дня — по всем найденным операциям дня, даже если часть из них ещё не показана («Показать ещё»).
  // Переводы не считаем: это не доход и не расход.
  const dayTotals = useMemo(() => {
    const totals = new Map();
    for (const tx of filtered) {
      if (tx.type === 'transfer') continue;
      const day = startOfDay(new Date(tx.date)).getTime();
      const total = totals.get(day) ?? { income: 0, expenses: 0 };
      if (tx.amount > 0) total.income += tx.amount;
      else total.expenses += tx.amount;
      totals.set(day, total);
    }
    return totals;
  }, [filtered]);

  // Группы по дням для видимой части списка
  const groups = [];
  filtered.slice(0, visibleCount).forEach((tx) => {
    const day = startOfDay(new Date(tx.date)).getTime();
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(tx);
    else groups.push({ day, label: formatGroupDate(new Date(day), today), items: [tx] });
  });

  // Сколько фильтров включено, кроме поиска — число на кнопке «Фильтры» на телефоне
  const activeFilters = [type !== ALL, categoryId !== ALL, Boolean(accountId), period !== ALL].filter(Boolean).length;
  const hasFilters = query || activeFilters > 0;
  const resetFilters = () => {
    setQuery('');
    setType(ALL);
    setCategoryId(ALL);
    setAccountId('');
    setPeriod(ALL);
    setCustom({ from: '', to: '' });
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

      {/* Поиск и фильтры. На телефоне карточка прилипает под шапкой (h-20), фильтры — под кнопкой */}
      <Reveal className="sticky top-20 z-20 lg:static">
        <Card className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:min-w-[18rem]">
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
            <button
              type="button"
              aria-expanded={isFiltersOpen}
              aria-controls="transactions-filters"
              onClick={() => setIsFiltersOpen((open) => !open)}
              className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors duration-200 lg:hidden ${
                isFiltersOpen ? 'bg-brand-fill text-white' : 'bg-surface text-ink'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t.filtersToggle}
              {activeFilters > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
          <div id="transactions-filters" className={`${isFiltersOpen ? 'flex' : 'hidden'} flex-wrap items-center gap-3 lg:flex`}>
            <SegmentedControl id="transactions-type" options={t.filters} value={type} onChange={handleTypeChange} />
            <div className="relative">
              <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label={t.periodLabel} className={selectClass}>
                {t.periods.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={custom.from}
                  max={custom.to || undefined}
                  onChange={(e) => setCustom((prev) => ({ ...prev, from: e.target.value }))}
                  aria-label={t.customFrom}
                  className={dateInputClass}
                />
                <span className="text-xs text-ink-muted">—</span>
                <input
                  type="date"
                  value={custom.to}
                  min={custom.from || undefined}
                  onChange={(e) => setCustom((prev) => ({ ...prev, to: e.target.value }))}
                  aria-label={t.customTo}
                  className={dateInputClass}
                />
              </div>
            )}
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label={t.categoryLabel}
                className={selectClass}
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
          { id: 'income', label: t.totals.income, value: <AnimatedMoney value={income} />, tone: 'text-positive' },
          { id: 'expenses', label: t.totals.expenses, value: <AnimatedMoney value={expenses} /> },
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
                  {/* Заголовок дня: дата слева, итог дня справа */}
                  <h3 className="flex items-baseline justify-between gap-3 px-2 text-xs font-semibold text-ink-muted">
                    <span className="truncate uppercase tracking-wide">{group.label}</span>
                    <DayTotal total={dayTotals.get(group.day)} />
                  </h3>
                  <ul className="-mx-2 mt-1 grid grid-cols-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {group.items.map((tx) => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          onSelect={openTransaction}
                          showDate={false}
                          compact
                          source={tx.importId && importFile[tx.importId] ? fillTemplate(t.fromImport, { file: importFile[tx.importId] }) : ''}
                          needsSort={needsSortIds.has(tx.id) ? t.needsSort : ''}
                        />
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
