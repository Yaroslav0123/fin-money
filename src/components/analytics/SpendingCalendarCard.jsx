import Card from '../ui/Card.jsx';
import { DATE_TEXTS } from '../../data/mockData.js';
import { formatDay, isSameDay, toDateInputValue } from '../../utils/dates.js';
import { CALENDAR_LEVELS } from '../../utils/finance.js';
import { fillTemplate, formatMoney } from '../../utils/format.js';

// Цвет клетки по ступени трат: от «трат нет» до самого дорогого дня.
// Один фирменный цвет с разной плотностью — порядок ступеней верный и в светлой, и в тёмной теме.
// На плотных клетках цифра цвета карточки: белая в светлой теме, тёмная в тёмной.
const LEVEL_CLASSES = [
  'bg-ink/[0.04] text-ink-muted',
  'bg-brand/20 text-ink',
  'bg-brand/45 text-ink',
  'bg-brand/75 text-card',
  'bg-brand text-card',
];

/**
 * Календарь трат за месяц: чем темнее день, тем больше в нём потратили.
 * calendar — результат spendingCalendar(); weekStart — 'mon' | 'sun' (порядок дней недели в шапке).
 * Нажатие на день с тратами открывает операции этого дня (onDayClick(дата в формате input)).
 */
export default function SpendingCalendarCard({ calendar, today, weekStart, texts, onDayClick, className = '' }) {
  const weekdays = weekStart === 'sun' ? DATE_TEXTS.weekdaysShort : [...DATE_TEXTS.weekdaysShort.slice(1), DATE_TEXTS.weekdaysShort[0]];

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <p className="text-xs text-ink-muted">
        {calendar.activeDays > 0 ? fillTemplate(texts.caption, { days: calendar.activeDays, max: formatMoney(calendar.max) }) : texts.empty}
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {weekdays.map((day) => (
          <span key={day} className="pb-1 text-[10px] font-semibold uppercase text-ink-muted" aria-hidden="true">
            {day}
          </span>
        ))}
        {calendar.weeks.flat().map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} aria-hidden="true" />;
          const label = `${formatDay(cell.date, today)}: ${cell.amount > 0 ? formatMoney(cell.amount) : texts.noSpending}`;
          const isToday = isSameDay(cell.date, today);
          const base = `flex aspect-square items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-transform duration-200 ${
            LEVEL_CLASSES[cell.level]
          } ${cell.isFuture ? 'opacity-40' : ''} ${isToday ? 'ring-2 ring-brand ring-offset-1 ring-offset-card' : ''}`;
          return cell.amount > 0 ? (
            <button
              key={cell.date.getTime()}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => onDayClick(toDateInputValue(cell.date))}
              className={`${base} hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
            >
              {cell.date.getDate()}
            </button>
          ) : (
            <span key={cell.date.getTime()} title={label} aria-label={label} className={base}>
              {cell.date.getDate()}
            </span>
          );
        })}
      </div>

      {/* Легенда ступеней */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-ink-muted" aria-hidden="true">
        {texts.less}
        {Array.from({ length: CALENDAR_LEVELS + 1 }, (_, level) => (
          <span key={level} className={`h-3 w-3 rounded ${LEVEL_CLASSES[level]}`} />
        ))}
        {texts.more}
      </div>
    </Card>
  );
}
