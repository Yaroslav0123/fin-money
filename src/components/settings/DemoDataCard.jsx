import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

/**
 * Карточка «Демо-данные»: сброс сохранённых в браузере операций, накоплений и целей.
 * Сброс в два шага: кнопка → вопрос «Удалить все изменения?» → подтверждение.
 */
export default function DemoDataCard({ texts, onReset, className = '' }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(false);
    onReset();
  };

  return (
    <Card className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        <p className="mt-1 text-xs text-ink-muted">{texts.description}</p>
      </div>

      {isConfirming ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3" role="group" aria-label={texts.confirmQuestion}>
          <span className="text-sm font-semibold text-ink">{texts.confirmQuestion}</span>
          <Button size="sm" pill variant="secondary" onClick={() => setIsConfirming(false)}>
            {texts.cancel}
          </Button>
          <Button size="sm" pill className="bg-negative shadow-none hover:bg-negative/90" onClick={handleConfirm}>
            {texts.confirm}
          </Button>
        </div>
      ) : (
        <Button size="sm" pill variant="secondary" className="shrink-0" onClick={() => setIsConfirming(true)}>
          <RotateCcw className="h-4 w-4" />
          {texts.action}
        </Button>
      )}
    </Card>
  );
}
