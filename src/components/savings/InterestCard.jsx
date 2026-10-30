import { CalendarClock, Percent } from 'lucide-react';
import { formatMoney } from '../../utils/format.js';

// Тёмно-зелёная карточка «Доход по процентам»
export default function InterestCard({ texts }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-card bg-gradient-to-br from-brand-dark to-brand-fill p-6 text-white sm:p-8">
      {/* Декоративный круг */}
      <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between">
        <h3 className="text-base font-bold">{texts.title}</h3>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <Percent className="h-5 w-5" />
        </span>
      </div>

      <p className="relative mt-6 text-xs text-white/60">{texts.monthLabel}</p>
      <p className="relative mt-1 text-4xl font-extrabold tracking-tight">+{formatMoney(texts.monthAmount)}</p>

      <dl className="relative mt-auto grid grid-cols-2 gap-4 border-t border-white/15 pt-5 text-sm">
        <div>
          <dt className="text-xs text-white/60">{texts.totalLabel}</dt>
          <dd className="mt-1 font-semibold">+{formatMoney(texts.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">{texts.rateLabel}</dt>
          <dd className="mt-1 font-semibold">{texts.rateValue}</dd>
        </div>
      </dl>
      <p className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs">
        <CalendarClock className="h-4 w-4 shrink-0 text-white/70" />
        <span className="text-white/70">{texts.nextLabel}:</span>
        <span className="font-semibold">{texts.nextDate}</span>
      </p>
    </div>
  );
}
