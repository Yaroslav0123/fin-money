import { useState } from 'react';
import { FileText, FileUp } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { loadSampleStatement } from '../../utils/sample.js';

/**
 * Приглашение загрузить выписку на «Главной» (пока ни одной не загружали).
 * Файл можно выбрать кнопкой или бросить прямо на карточку — окно импорта откроется уже с ним.
 * «Пример выписки» загружает образец с вымышленными данными.
 */
export default function StatementCard({ texts, className = '' }) {
  const { openImport } = useAppActions();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) openImport(file);
  };

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative overflow-hidden border-2 border-dashed p-5 transition-colors duration-200 sm:p-6 ${
        isDragging ? 'border-brand bg-brand-light' : 'border-brand-soft'
      } ${className}`}
    >
      {/* Мягкое зелёное пятно справа — как на сайте */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-bl from-brand-soft to-transparent opacity-70 blur-2xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
        {/* На телефоне без крупной иконки — карточка и так занимает пол-экрана */}
        <IconTile icon={FileUp} accent="brand" size="lg" className="hidden sm:inline-flex" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink">{isDragging ? texts.drop : texts.title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-secondary">{texts.text}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button size="sm" pill onClick={() => openImport()} className="whitespace-nowrap px-3 sm:px-5">
            <FileUp className="hidden h-4 w-4 sm:block" />
            {texts.choose}
          </Button>
          <Button size="sm" pill variant="secondary" onClick={() => openImport(loadSampleStatement)} className="whitespace-nowrap px-3 sm:px-5">
            <FileText className="hidden h-4 w-4 sm:block" />
            {texts.sample}
          </Button>
        </div>
      </div>
    </Card>
  );
}
