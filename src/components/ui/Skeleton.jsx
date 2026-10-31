/**
 * Заглушка на время загрузки: мягко «дышащий» серый блок вместо пустоты.
 * Размер и скругление задаёт className. При «уменьшить движение» — без пульсации.
 */
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-ink/5 motion-reduce:animate-none ${className}`} />;
}

/**
 * Заглушка экрана приложения, пока скачивается его код: ряд показателей и две большие карточки.
 * label — текст для экранных дикторов («Загрузка…»).
 */
export function ScreenSkeleton({ label }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-card bg-card p-5 shadow-soft">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="mt-5 h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-6 w-36 rounded-full" />
        </div>
      ))}
      <div className="rounded-card bg-card p-6 shadow-soft xl:col-span-2">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-6 h-64" />
      </div>
      <div className="rounded-card bg-card p-6 shadow-soft">
        <Skeleton className="h-4 w-28 rounded-full" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mt-5 flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0" />
            <Skeleton className="h-3 flex-1 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
