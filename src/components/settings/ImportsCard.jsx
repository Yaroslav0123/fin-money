import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import IconTile from '../ui/IconTile.jsx';
import { formatFullDate } from '../../utils/dates.js';
import { fillTemplate, plural } from '../../utils/format.js';

/**
 * Карточка «История импорта»: загруженные выписки, у каждой — «Отменить» с подтверждением.
 * imports — [{ id, fileName, date, count }] (count — сколько операций пакета осталось сейчас);
 * onUndo(id) — отменить импорт; onUpload — перейти к загрузке выписки.
 */
export default function ImportsCard({ texts, imports, onUndo, onUpload, className = '' }) {
  // Импорт, отмену которого подтверждаем, или null
  const [confirming, setConfirming] = useState(null);

  const handleConfirm = () => {
    onUndo(confirming.id);
    setConfirming(null);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{texts.description}</p>

      {imports.length === 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
          <p className="text-sm text-ink-secondary">{texts.empty}</p>
          <Button size="sm" pill variant="secondary" onClick={onUpload}>
            <Upload className="h-4 w-4" />
            {texts.emptyAction}
          </Button>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {imports.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <IconTile icon={FileText} accent="brand" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.fileName}</p>
                <p className="text-xs text-ink-muted">
                  {formatFullDate(new Date(item.date))} · {item.count} {plural(item.count, texts.count)}
                </p>
              </div>
              <Button
                size="sm"
                pill
                variant="secondary"
                aria-label={fillTemplate(texts.undoLabel, { name: item.fileName })}
                onClick={() => setConfirming(item)}
              >
                {texts.undo}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirming)}
        title={confirming ? fillTemplate(texts.undoQuestion, { name: confirming.fileName }) : ''}
        text={confirming ? fillTemplate(texts.undoText, { count: confirming.count }) : ''}
        confirmLabel={texts.undoConfirm}
        cancelLabel={texts.cancel}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </Card>
  );
}
