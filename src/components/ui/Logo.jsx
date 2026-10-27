import LeafMark from './LeafMark.jsx';

// Размеры логотипа
const SIZES = {
  sm: { mark: 'h-6 w-8', text: 'text-xl', gap: 'gap-2' },
  md: { mark: 'h-8 w-11', text: 'text-2xl', gap: 'gap-2.5' },
  lg: { mark: 'h-9 w-12', text: 'text-[34px]', gap: 'gap-3' },
};

// Логотип: знак из двух листьев + название. light — для тёмного фона.
export default function Logo({ name, size = 'lg', light = false, className = '' }) {
  const s = SIZES[size];
  const textColor = light ? 'text-white' : 'text-ink';

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LeafMark className={`${s.mark} shrink-0`} light={light} />
      {/* Название не переносится на две строки */}
      <span className={`${s.text} whitespace-nowrap font-bold leading-none tracking-tight ${textColor}`}>{name}</span>
    </div>
  );
}
