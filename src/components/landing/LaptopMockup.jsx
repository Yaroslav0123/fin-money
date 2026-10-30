import DonutLegend from '../charts/DonutLegend.jsx';
import { ExpenseDonut } from '../charts/lazy.jsx';
import IconTile from '../ui/IconTile.jsx';
import LeafMark from '../ui/LeafMark.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import { formatMoney } from '../../utils/format.js';

/*
 * Превью приложения на экране ноутбука.
 * Весь интерфейс внутри задан в единицах em, а базовый размер шрифта — в cqw
 * (процент ширины контейнера). Поэтому превью масштабируется целиком,
 * как картинка, на любой ширине экрана.
 */

// Боковое меню мини-приложения
function PreviewSidebar({ appName, items }) {
  return (
    <aside className="flex flex-col gap-[0.35em] border-r border-line bg-card p-[1em]">
      <div className="mb-[1em] flex items-center gap-[0.4em]">
        <LeafMark className="h-[1.5em] w-[2em]" />
        <span className="text-[1.05em] font-bold">{appName}</span>
      </div>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === 0;
        return (
          <div
            key={item.id}
            className={`flex items-center gap-[0.5em] rounded-[0.6em] px-[0.6em] py-[0.5em] ${
              isActive ? 'bg-brand-light font-semibold text-brand' : 'text-ink-muted'
            }`}
          >
            <Icon className="h-[1.2em] w-[1.2em]" />
            {item.label}
          </div>
        );
      })}
    </aside>
  );
}

// Мини-карточка «Доходы» / «Расходы»
function PreviewStat({ stat }) {
  return (
    <div className="rounded-[0.9em] bg-card p-[0.9em] shadow-soft">
      <IconTile icon={stat.icon} accent={stat.accent} size="em" />
      <p className="mt-[0.6em] text-ink-muted">{stat.label}</p>
      <p className="text-[1.25em] font-bold">{formatMoney(stat.amount)}</p>
      <TrendBadge trend={stat.trend} size="em" className="mt-[0.4em]" />
    </div>
  );
}

// Мини-карточка структуры расходов
function PreviewDonut({ title, caption, total, categories }) {
  return (
    <div className="rounded-[0.9em] bg-card p-[0.9em] shadow-soft">
      <p className="font-bold">{title}</p>
      <div className="mt-[0.6em] flex items-center gap-[1em]">
        <ExpenseDonut
          data={categories}
          centerValue={formatMoney(total)}
          centerCaption={caption}
          className="h-[7.5em] w-[7.5em]"
          valueClassName="text-[0.95em]"
          captionClassName="text-[0.7em]"
          animate={false}
        />
        <DonutLegend categories={categories} className="gap-[0.35em] text-[0.85em]" dotClassName="h-[0.6em] w-[0.6em]" />
      </div>
    </div>
  );
}

// Мини-карточка накопительного счёта
function PreviewSavings({ savings, savingsIcon }) {
  return (
    <div className="flex flex-col gap-[0.8em] rounded-[0.9em] bg-card p-[1.1em] shadow-soft">
      <IconTile icon={savingsIcon} accent="brand" size="em" />
      <div>
        <p className="text-[1.2em] font-bold">{savings.title}</p>
        <p className="mt-[0.3em] text-[0.85em] text-ink-muted">{savings.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-[0.4em] text-[0.85em]">
        {savings.features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.id}>
              <Icon className="h-[1.1em] w-[1.1em] text-ink-secondary" />
              <p className="mt-[0.3em] font-semibold">{f.title}</p>
              <p className="text-ink-muted">{f.caption}</p>
            </div>
          );
        })}
      </div>
      <div className="rounded-[0.8em] bg-surface p-[0.8em]">
        <p className="text-ink-muted">{savings.balanceLabel}</p>
        <p className="text-[1.6em] font-bold">{formatMoney(savings.balance)}</p>
        <TrendBadge trend={savings.trend} size="em" />
      </div>
      <div className="rounded-[0.7em] bg-brand-fill py-[0.7em] text-center font-semibold text-white">
        {savings.depositAction}
      </div>
    </div>
  );
}

export default function LaptopMockup({ appName, sidebar, summary, categories, savings, savingsIcon, donut }) {
  return (
    <div className="relative w-full [container-type:inline-size]">
      {/* Крышка с экраном */}
      <div className="relative mx-[5%] rounded-t-[2.2cqw] bg-device p-[1.3cqw] pb-[1.8cqw] shadow-laptop">
        {/* Камера */}
        <span className="absolute left-1/2 top-[0.45cqw] h-[0.5cqw] w-[0.5cqw] -translate-x-1/2 rounded-full bg-white/25" />

        <div className="grid aspect-[16/10] grid-cols-[18%_1fr] overflow-hidden rounded-[0.6cqw] bg-surface text-[1.2cqw] leading-snug text-ink">
          <PreviewSidebar appName={appName} items={sidebar} />

          <div className="grid min-w-0 grid-cols-[1.15fr_1fr] gap-[1.1em] p-[1.3em]">
            <div className="flex min-w-0 flex-col gap-[0.9em]">
              <div>
                <p className="text-ink-muted">{summary.balance.label}</p>
                <p className="text-[2.3em] font-extrabold leading-tight tracking-tight">
                  {formatMoney(summary.balance.amount)}
                </p>
                <TrendBadge trend={summary.balance.trend} size="em" />
              </div>
              <div className="grid grid-cols-2 gap-[0.8em]">
                <PreviewStat stat={summary.income} />
                <PreviewStat stat={summary.expenses} />
              </div>
              <PreviewDonut
                title={donut.title}
                caption={donut.caption}
                total={summary.expenses.amount}
                categories={categories}
              />
            </div>
            <PreviewSavings savings={savings} savingsIcon={savingsIcon} />
          </div>
        </div>
      </div>

      {/* Основание ноутбука */}
      <div className="relative h-[2.2cqw] rounded-b-[2.6cqw] bg-gradient-to-b from-brand-muted to-brand shadow-soft">
        <span className="absolute left-1/2 top-0 h-[0.7cqw] w-[14%] -translate-x-1/2 rounded-b-[1cqw] bg-brand-dark/40" />
      </div>
    </div>
  );
}
