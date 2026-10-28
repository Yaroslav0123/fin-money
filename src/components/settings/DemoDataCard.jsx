import { useState } from 'react';
import { Info, RotateCcw, SquarePlus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

/**
 * Карточка «Данные»: всё хранится в этом браузере.
 * «Новые демо-данные» — заново строит год истории от сегодняшнего дня,
 * «Начать с нуля» — удаляет операции, накопления и цели. Оба действия с подтверждением.
 * onAbout — окно «О проекте и данных».
 */
export default function DemoDataCard({ texts, onReset, onClear, onAbout, className = '' }) {
  // 'demo' | 'empty' | null — какое действие подтверждаем
  const [confirming, setConfirming] = useState(null);
  const isDemo = confirming === 'demo';

  const handleConfirm = () => {
    setConfirming(null);
    if (isDemo) onReset();
    else onClear();
  };

  return (
    <Card className={`flex flex-col p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{texts.description}</p>

      <div className="mt-auto grid gap-2 pt-5">
        <Button size="sm" pill variant="secondary" onClick={() => setConfirming('demo')}>
          <RotateCcw className="h-4 w-4" />
          {texts.action}
        </Button>
        <Button size="sm" pill variant="secondary" onClick={() => setConfirming('empty')}>
          <SquarePlus className="h-4 w-4" />
          {texts.emptyAction}
        </Button>
        <Button size="sm" pill variant="ghost" onClick={onAbout}>
          <Info className="h-4 w-4" />
          {texts.about}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirming)}
        title={isDemo ? texts.confirmQuestion : texts.emptyQuestion}
        confirmLabel={isDemo ? texts.confirm : texts.emptyConfirm}
        cancelLabel={texts.cancel}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </Card>
  );
}
