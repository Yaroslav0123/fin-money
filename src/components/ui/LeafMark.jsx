// Фирменный знак Fin Money — два листа. Нарисован отдельным SVG,
// потому что это логотип, а не иконка интерфейса.
export default function LeafMark({ className = '', light = false }) {
  const backLeaf = light ? 'fill-white/40' : 'fill-brand-soft';
  const frontLeaf = light ? 'fill-white' : 'fill-brand';
  const vein = light ? 'stroke-brand/30' : 'stroke-white/40';

  return (
    <svg viewBox="0 0 48 34" className={className} aria-hidden="true">
      {/* Задний светлый лист */}
      <path className={backLeaf} d="M1 20C4 8 16 1 30 3c-3 12-14 21-29 17Z" />
      {/* Передний лист */}
      <path className={frontLeaf} d="M10 31C14 17 28 8 47 9c-4 15-19 24-37 22Z" />
      {/* Прожилка */}
      <path
        className={`fill-none ${vein}`}
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M14 28C22 21 31 16 40 13"
      />
    </svg>
  );
}
