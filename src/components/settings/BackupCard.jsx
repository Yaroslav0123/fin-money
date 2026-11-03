import { useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { parseBackup } from '../../context/financeStorage.js';
import { formatFullDate } from '../../utils/dates.js';
import { fillTemplate, plural } from '../../utils/format.js';

/**
 * Карточка «Резервная копия»: скачать все данные одним JSON-файлом и восстановить их из такого файла.
 * Перед заменой — подтверждение с тем, что лежит в копии. Чужой или повреждённый файл не принимается.
 * onDownload() — скачать копию; onRestore(data) — заменить состояние проверенной копией; onError(text) — сообщение.
 */
export default function BackupCard({ texts, onDownload, onRestore, onError, className = '' }) {
  const inputRef = useRef(null);
  // Проверенная копия, которую подтверждаем: { data, exportedAt }
  const [pending, setPending] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (backup) setPending(backup);
    else onError(texts.invalid);
  };

  const handleConfirm = () => {
    onRestore(pending.data);
    setPending(null);
  };

  const count = pending?.data.transactions.length ?? 0;
  const confirmText = pending
    ? fillTemplate(texts.confirmText, {
        date: pending.exportedAt ? formatFullDate(pending.exportedAt) : '—',
        count,
        word: plural(count, texts.countWords),
        goals: pending.data.goals.length,
      })
    : '';

  return (
    <Card className={`flex flex-col p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{texts.description}</p>

      <div className="mt-auto grid gap-2 pt-5">
        <Button size="sm" pill onClick={onDownload}>
          <Download className="h-4 w-4" />
          {texts.download}
        </Button>
        <Button size="sm" pill variant="secondary" onClick={() => inputRef.current?.click()}>
          <FileUp className="h-4 w-4" />
          {texts.restore}
        </Button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} aria-hidden="true" tabIndex={-1} />
      </div>

      <ConfirmDialog
        isOpen={Boolean(pending)}
        title={texts.confirmQuestion}
        text={confirmText}
        confirmLabel={texts.confirm}
        cancelLabel={texts.cancel}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </Card>
  );
}
