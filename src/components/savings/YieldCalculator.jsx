import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { formatMoney } from '../../utils/format.js';
import { KOPECKS_IN_RUBLE } from '../../utils/money.js';

const MONTHS_IN_YEAR = 12;
const PERCENT = 100;

/**
 * Расчёт итоговой суммы с ежемесячной капитализацией:
 * каждый месяц начисляются проценты, затем добавляется пополнение.
 */
function calculateYield({ startBalance, monthly, months, annualRate }) {
  const monthlyRate = annualRate / PERCENT / MONTHS_IN_YEAR;
  let total = startBalance;
  for (let i = 0; i < months; i += 1) {
    total = total * (1 + monthlyRate) + monthly;
  }
  const interest = total - startBalance - monthly * months;
  // Прогноз — до рубля
  const toRuble = (kopecks) => Math.round(kopecks / KOPECKS_IN_RUBLE) * KOPECKS_IN_RUBLE;
  return { total: toRuble(total), interest: toRuble(interest) };
}

// Слайдер с подписью и текущим значением
function RangeField({ label, value, valueLabel, range, onChange }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-muted">{label}</span>
        <span className="font-bold text-ink">{valueLabel}</span>
      </span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full cursor-pointer accent-brand"
      />
    </label>
  );
}

// Интерактивный калькулятор: сколько будет на счёте через N месяцев
export default function YieldCalculator({ startBalance, annualRate, texts, className = '' }) {
  const [monthly, setMonthly] = useState(texts.defaults.monthly);
  const [months, setMonths] = useState(texts.defaults.term);

  const result = useMemo(
    () => calculateYield({ startBalance, monthly, months, annualRate }),
    [startBalance, monthly, months, annualRate],
  );

  return (
    <Card className={`flex flex-col p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <Calculator className="h-5 w-5" />
        </span>
        <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      </div>

      <div className="mt-6 space-y-6">
        <RangeField
          label={texts.monthlyLabel}
          value={monthly}
          valueLabel={formatMoney(monthly)}
          range={texts.ranges.monthly}
          onChange={setMonthly}
        />
        <RangeField
          label={texts.termLabel}
          value={months}
          valueLabel={`${months} ${texts.monthsSuffix}`}
          range={texts.ranges.term}
          onChange={setMonths}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-4">
        <p className="text-xs text-ink-muted">
          {texts.resultPrefix} {months} {texts.monthsSuffix} {texts.resultSuffix}
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{formatMoney(result.total)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {texts.interestLabel}: <span className="font-semibold text-positive">+{formatMoney(result.interest)}</span>
        </p>
      </div>

      <p className="mt-auto pt-4 text-[11px] leading-relaxed text-ink-muted">{texts.note}</p>
    </Card>
  );
}
