import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { IMPORT_DIALOG } from '../../data/mockData.js';
import { formatDay } from '../../utils/dates.js';
import { parseCsv } from '../../utils/csv.js';
import { fillTemplate, formatMoney, formatSignedMoney } from '../../utils/format.js';
import { rowsToDrafts } from '../../utils/statement.js';

const PREVIEW_ROWS = 5;

/**
 * Импорт выписки CSV: выбор или перетаскивание файла → проверка → итоги и первые операции →
 * подтверждение. Файл читается прямо в браузере и никуда не отправляется.
 * onDone(count) — сколько операций добавлено.
 */
export default function ImportDialog({ isOpen, onClose, onDone }) {
  const { categories, rawTransactions, addTransactions, describe } = useFinance();
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const t = IMPORT_DIALOG;

  const reset = () => {
    setResult(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFile = async (file) => {
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      setResult({ fileName: file.name, ...rowsToDrafts(rows, { categories, existing: rawTransactions }) });
    } catch {
      setResult({ fileName: file.name, error: 'readError' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const handleImport = () => {
    addTransactions(result.drafts);
    const count = result.drafts.length;
    reset();
    onDone(count);
  };

  const drafts = result?.drafts ?? [];
  const income = drafts.filter((d) => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const expenses = drafts.filter((d) => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  const errorText = result?.error ? t[result.error] : result && drafts.length === 0 ? t.empty : null;

  return (
    <Modal isOpen={isOpen} title={t.title} onClose={handleClose} closeLabel={t.cancel}>
      {!result ? (
        <>
          <p className="text-sm leading-relaxed text-ink-secondary">{t.hint}</p>
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
            <span className="text-sm font-semibold text-ink">{isDragging ? t.dropActive : t.dropLabel}</span>
            <span className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white">{t.chooseFile}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => readFile(e.target.files[0])}
            />
          </label>
        </>
      ) : (
        <>
          <p className="truncate text-xs text-ink-muted">{result.fileName}</p>
          {errorText ? (
            <p className="mt-3 rounded-2xl bg-negative-bg px-4 py-3 text-sm text-negative" role="alert">
              {errorText}
            </p>
          ) : (
            <>
              <p className="mt-2 text-base font-bold text-ink">{fillTemplate(t.found, { count: drafts.length })}</p>
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
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.preview}</p>
              <ul className="mt-2 divide-y divide-line">
                {drafts.slice(0, PREVIEW_ROWS).map((draft, index) => {
                  const tx = describe({ ...draft, id: `preview-${index}`, amount: draft.type === 'income' ? draft.amount : -draft.amount, date: draft.date.toISOString() });
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-2.5">
                      <IconTile icon={tx.icon} accent={tx.accent} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{tx.title}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {tx.category} · {formatDay(draft.date)}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold ${tx.amount > 0 ? 'text-positive' : 'text-ink'}`}>
                        {formatSignedMoney(tx.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {result.skipped > 0 && <p className="mt-3 text-xs text-ink-muted">{fillTemplate(t.skipped, { count: result.skipped })}</p>}
            </>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" onClick={reset}>
              {t.another}
            </Button>
            <Button size="md" disabled={drafts.length === 0} onClick={handleImport} className="disabled:opacity-40 disabled:shadow-none">
              {t.confirm}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
