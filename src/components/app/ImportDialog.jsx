import { useEffect, useRef, useState } from 'react';
import { Check, FileUp } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { CATEGORY_ICONS, IMPORT_DIALOG, IMPORT_TRANSFER } from '../../data/mockData.js';
import { formatDay } from '../../utils/dates.js';
import { sberLinesToRows } from '../../utils/bankPdf.js';
import { decodeCsv, parseCsv } from '../../utils/csv.js';
import { fillTemplate, formatMoney, formatSignedMoney } from '../../utils/format.js';
import { loadSampleStatement, SAMPLE_STATEMENT } from '../../utils/sample.js';
import {
  applyCategoryChoice,
  categoryChoiceOf,
  importReport,
  rowsToDrafts,
  signedDraftAmount,
  withImportCategories,
} from '../../utils/statement.js';
import AccountSelect from './AccountSelect.jsx';
import CategorySelect from './CategorySelect.jsx';
import ImportReport from './ImportReport.jsx';

// Сколько строк предпросмотра показывать за раз
const PAGE_SIZE = 30;

const isPdfFile = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

// Файл → таблица строк: PDF-выписка Сбербанка (pdf.js подгружается только для PDF) или CSV
const readRows = async (file) => {
  const buffer = await file.arrayBuffer();
  if (!isPdfFile(file)) return parseCsv(decodeCsv(buffer));
  const { pdfToLines } = await import('../../utils/pdf.js');
  return sberLinesToRows(await pdfToLines(buffer));
};

// Шаги над содержимым окна: «Файл → Проверка → Итог»
function ImportSteps({ current }) {
  const t = IMPORT_DIALOG;
  return (
    <ol aria-label={t.stepsLabel} className="mb-5 flex items-center gap-2 text-xs font-semibold">
      {t.steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li key={label} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                isDone ? 'bg-brand-fill text-white' : isCurrent ? 'bg-brand-light text-brand ring-2 ring-brand' : 'bg-ink/5 text-ink-muted'
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <span className={isDone || isCurrent ? 'text-ink' : 'text-ink-muted'}>{label}</span>
            {index < t.steps.length - 1 && <span className={`h-0.5 min-w-3 flex-1 rounded-full ${isDone ? 'bg-brand' : 'bg-ink/10'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Импорт выписки (PDF Сбербанка или CSV): выбор или перетаскивание файла → проверка всех строк → итог.
 * Окно одно на всё приложение (AppActionsContext.openImport) и монтируется заново при каждом открытии.
 * source — файл, который уже выбрали (перетащили на «Главную»), или функция, которая его загрузит (пример выписки);
 * без source окно начинается с выбора файла.
 * В предпросмотре у каждой строки можно сменить категорию (или сделать её переводом между своими счетами)
 * и снять галочку. Новая категория сразу ставится похожим строкам (тот же магазин) и запоминается
 * правилом для следующих выписок. Строки, которые не попадут в импорт, перечислены с причиной.
 * Если счетов несколько, сначала выбирается счёт выписки: повторы ищутся среди его операций, туда же попадёт импорт.
 * После импорта окно показывает отчёт «Что нашли в выписке»: период, итоги, главные категории, крупные траты
 * и сколько осталось в «Другом» — с переходом к разбору и к аналитике.
 * Файл читается прямо в браузере и никуда не отправляется. onImported(count) — сколько операций добавлено.
 */
export default function ImportDialog({ isOpen, source = null, onClose, onImported }) {
  const { categories, rawTransactions, addTransactions, categoryRules, accounts } = useFinance();
  const { navigate } = useAppActions();
  const [accountId, setAccountId] = useState(accounts[0].id);
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  // { fileName, error } или { fileName, items: [{ line, status, reason?, draft?, cells, key, include, touched }], rules: { [key]: rule } }
  const [result, setResult] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  // Итог импорта (importReport) — третий шаг окна
  const [report, setReport] = useState(null);
  const inputRef = useRef(null);
  const sourceRead = useRef(false);
  const t = IMPORT_DIALOG;

  // Свои категории + «Прочие доходы», если их ещё нет (добавятся при импорте)
  const importCategories = withImportCategories(categories);
  const categoryById = Object.fromEntries(importCategories.map((c) => [c.id, c]));
  const expenseCategories = importCategories.filter((c) => c.type === 'expense');
  const incomeCategories = importCategories.filter((c) => c.type === 'income');

  const reset = () => {
    setResult(null);
    setReport(null);
    setVisibleCount(PAGE_SIZE);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // file — файл или функция, которая его загрузит (пример выписки)
  const readFile = async (fileOrLoader) => {
    if (!fileOrLoader) return;
    setIsReading(true);
    let file = { name: SAMPLE_STATEMENT };
    try {
      if (typeof fileOrLoader === 'function') {
        try {
          file = await fileOrLoader();
        } catch {
          setResult({ fileName: file.name, error: 'sampleError' });
          return;
        }
      } else {
        file = fileOrLoader;
      }
      const rows = await readRows(file);
      const existing = rawTransactions.filter((tx) => tx.accountId === account.id);
      const parsed = rowsToDrafts(rows, { categories, existing, rules: categoryRules });
      // В PDF без операций нет и «столбцов» — объясняем, какие PDF подходят
      const error = parsed.error && isPdfFile(file) ? 'pdfUnknown' : parsed.error;
      setResult(
        error
          ? { fileName: file.name, error }
          : { fileName: file.name, items: parsed.items.map((item) => ({ ...item, include: item.status === 'new' })), rules: {} },
      );
    } catch {
      setResult({ fileName: file.name, error: 'readError' });
    } finally {
      setIsReading(false);
    }
  };

  // Файл, переданный при открытии, читаем сразу (один раз — в режиме разработки эффект запускается дважды)
  useEffect(() => {
    if (!source || sourceRead.current) return;
    sourceRead.current = true;
    readFile(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при открытии окна
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  // Правка одной строки предпросмотра
  const changeItem = (line, change) =>
    setResult((prev) => ({ ...prev, items: prev.items.map((item) => (item.line === line ? { ...item, ...change(item) } : item)) }));

  // Смена категории строки: то же ставим похожим строкам (тот же магазин), которые ещё не меняли вручную,
  // и запоминаем выбор, чтобы применить его к следующим выпискам
  const changeCategory = (line, value) =>
    setResult((prev) => {
      const target = prev.items.find((item) => item.line === line);
      const items = prev.items.map((item) => {
        const isTarget = item.line === line;
        const isSimilar = !isTarget && target.key && item.key === target.key && item.status === 'new' && !item.touched;
        if (!isTarget && !isSimilar) return item;
        return { ...item, touched: item.touched || isTarget, draft: applyCategoryChoice(item.draft, value, importCategories) };
      });
      const rules = target.key ? { ...prev.rules, [target.key]: { key: target.key, value, label: target.cells.description } } : prev.rules;
      return { ...prev, items, rules };
    });

  const newItems = result?.items?.filter((item) => item.status === 'new') ?? [];
  const newRules = Object.values(result?.rules ?? {});
  const skippedItems = result?.items?.filter((item) => item.status !== 'new') ?? [];
  const included = newItems.filter((item) => item.include).map((item) => item.draft);

  const handleImport = () => {
    addTransactions(included, { fileName: result.fileName, rules: newRules, accountId: account.id });
    setReport(importReport(included, importCategories));
    onImported(included.length);
  };

  // Из отчёта — к разбору «Другого» или в аналитику
  const goTo = (screen, params) => {
    handleClose();
    navigate(screen, params);
  };

  // Итоги выбранных строк. Возвраты показываем отдельно (они уменьшат расходы), переводы не входят никуда.
  const total = (filter) => included.filter(filter).reduce((sum, d) => sum + d.amount, 0);
  const income = total((d) => d.type === 'income');
  const expenses = total((d) => d.type === 'expense' && !d.incoming);
  const refunds = total((d) => d.type === 'expense' && d.incoming);
  const transfers = included.filter((d) => d.type === 'transfer').length;
  const errorText = result?.error ? t[result.error] : result && newItems.length === 0 ? t.empty : null;

  // Причины пропуска: «уже есть в Fin Money — 3, дата в будущем — 1»
  const reasonCounts = skippedItems.reduce((counts, item) => ({ ...counts, [item.reason]: (counts[item.reason] ?? 0) + 1 }), {});
  const reasonSummary = Object.entries(reasonCounts)
    .map(([reason, count]) => `${t.reasons[reason]} — ${count}`)
    .join(', ');

  // Вид строки: иконка и подпись категории (или перевода)
  const describeDraft = (draft) => {
    if (draft.type === 'transfer') return { icon: IMPORT_TRANSFER.icon, accent: IMPORT_TRANSFER.accent, category: IMPORT_TRANSFER.category };
    const category = categoryById[draft.categoryId];
    return { icon: CATEGORY_ICONS[category.iconId] ?? CATEGORY_ICONS.other, accent: category.accent, category: category.name };
  };

  return (
    <Modal isOpen={isOpen} title={t.title} onClose={handleClose} closeLabel={t.cancel} size={result?.items && !report ? 'lg' : 'md'}>
      <ImportSteps current={report ? 2 : result ? 1 : 0} />
      {report ? (
        <ImportReport report={report} onSort={() => goTo('transactions', { sort: true })} onAnalytics={() => goTo('analytics')} onFinish={handleClose} />
      ) : !result ? (
        <>
          <p className="text-sm leading-relaxed text-ink-secondary">{t.hint}</p>
          {accounts.length > 1 && (
            <div className="mt-4">
              <label htmlFor="import-account" className="text-xs font-medium text-ink-muted">
                {t.accountLabel}
              </label>
              <AccountSelect id="import-account" accounts={accounts} value={account.id} onChange={setAccountId} className="mt-2 h-12 w-full" />
            </div>
          )}
          {/* Зона выбора файла: клик или перетаскивание */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors duration-200 focus-within:ring-2 focus-within:ring-brand ${
              isDragging ? 'border-brand bg-brand-light' : 'border-brand-soft hover:bg-brand-light/50'
            }`}
          >
            <IconTile icon={FileUp} accent="brand" />
            <span className="text-sm font-semibold text-ink" role="status">
              {isReading ? t.reading : isDragging ? t.dropActive : t.dropLabel}
            </span>
            <span className="rounded-full bg-brand-fill px-4 py-2 text-xs font-semibold text-white">{t.chooseFile}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,.pdf,application/pdf"
              disabled={isReading}
              className="sr-only"
              onChange={(e) => readFile(e.target.files[0])}
            />
          </label>
          {/* Пока читаем файл (PDF разбирается дольше CSV) — заглушка будущей таблицы */}
          {isReading && (
            <div className="mt-4 grid gap-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                  <Skeleton className="h-3 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-ink-muted">
            {t.sampleHint}{' '}
            <button type="button" disabled={isReading} onClick={() => readFile(loadSampleStatement)} className="font-semibold text-brand hover:underline">
              {t.sampleAction}
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="truncate text-xs text-ink-muted">
            {result.fileName}
            {accounts.length > 1 && ` · ${fillTemplate(t.accountNote, { name: account.name })}`}
          </p>
          {errorText ? (
            <p className="mt-3 rounded-2xl bg-negative-bg px-4 py-3 text-sm text-negative" role="alert">
              {errorText}
            </p>
          ) : (
            <>
              <p className="mt-2 text-base font-bold text-ink">{fillTemplate(t.found, { count: included.length, total: newItems.length })}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-surface px-4 py-3">
                  <dt className="text-xs text-ink-muted">{t.income}</dt>
                  <dd className="mt-1 font-bold text-positive">{formatMoney(income)}</dd>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-3">
                  <dt className="text-xs text-ink-muted">{t.expenses}</dt>
                  <dd className="mt-1 font-bold text-ink">{formatMoney(expenses)}</dd>
                </div>
              </dl>
              {refunds > 0 && <p className="mt-2 text-xs text-ink-muted">{fillTemplate(t.refunds, { amount: formatMoney(refunds) })}</p>}
              {transfers > 0 && <p className="mt-1 text-xs text-ink-muted">{fillTemplate(t.transfers, { count: transfers })}</p>}

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.preview}</p>
              <p className="mt-1 text-xs text-ink-muted">{t.previewHint}</p>
              {newRules.length > 0 && (
                <p className="mt-1 text-xs font-semibold text-brand" role="status">
                  {fillTemplate(t.rulesNote, { count: newRules.length })}
                </p>
              )}
              <ul className="mt-2 divide-y divide-line">
                {newItems.slice(0, visibleCount).map(({ line, draft, cells, include }) => {
                  const view = describeDraft(draft);
                  const signed = signedDraftAmount(draft);
                  const isRefund = draft.type === 'expense' && draft.incoming;
                  return (
                    <li key={line} className={`flex items-start gap-3 py-3 transition-opacity duration-200 ${include ? '' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        checked={include}
                        onChange={(e) => changeItem(line, () => ({ include: e.target.checked }))}
                        aria-label={fillTemplate(t.include, { line })}
                        className="mt-2.5 h-4 w-4 shrink-0 cursor-pointer accent-brand"
                      />
                      <IconTile icon={view.icon} accent={view.accent} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-ink">{cells.description || view.category}</p>
                          <span className={`shrink-0 text-sm font-bold ${signed > 0 ? 'text-positive' : 'text-ink'}`}>{formatSignedMoney(signed)}</span>
                        </div>
                        <p className="truncate text-xs text-ink-muted">
                          {formatDay(draft.date)}
                          {isRefund && ` · ${t.refundBadge}`}
                        </p>
                        <div className="mt-2">
                          <CategorySelect
                            incoming={draft.incoming}
                            value={categoryChoiceOf(draft)}
                            disabled={!include}
                            onChange={(value) => changeCategory(line, value)}
                            incomeCategories={incomeCategories}
                            expenseCategories={expenseCategories}
                            label={fillTemplate(t.categoryLabel, { line })}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {newItems.length > visibleCount && (
                <Button variant="secondary" size="md" fullWidth className="mt-2" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  {t.showMore}
                </Button>
              )}
            </>
          )}

          {/* Строки, которые не попадут в импорт: причины и сами строки по запросу */}
          {skippedItems.length > 0 && !result.error && (
            <details className="mt-4 rounded-2xl bg-surface px-4 py-3 text-xs text-ink-muted">
              <summary className="cursor-pointer font-semibold text-ink-secondary">
                {fillTemplate(t.skipped, { count: skippedItems.length })} ({reasonSummary})
              </summary>
              <ul className="mt-2 space-y-1">
                {skippedItems.map(({ line, reason, cells }) => (
                  <li key={line} className="truncate">
                    {line}. {[cells.date, cells.description, cells.amount].filter(Boolean).join(' · ')} — {t.reasons[reason]}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" onClick={reset}>
              {t.another}
            </Button>
            <Button size="md" disabled={included.length === 0} onClick={handleImport} className="disabled:opacity-40 disabled:shadow-none">
              {t.confirm}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
