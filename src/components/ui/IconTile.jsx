import { ACCENTS } from '../../theme/accents.js';

// Размеры «плитки» и иконки внутри
const SIZES = {
  sm: { tile: 'h-9 w-9 rounded-xl', icon: 'h-4 w-4' },
  md: { tile: 'h-11 w-11 rounded-2xl', icon: 'h-5 w-5' },
  lg: { tile: 'h-16 w-16 rounded-[20px]', icon: 'h-7 w-7' },
  // Масштабируется от размера шрифта родителя (для мини-превью)
  em: { tile: 'h-[2.2em] w-[2.2em] rounded-[0.7em]', icon: 'h-[1.1em] w-[1.1em]' },
};

// Скруглённая цветная подложка с иконкой (категории, карточки, цели)
export default function IconTile({ icon: Icon, accent = 'brand', size = 'md', className = '' }) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${s.tile} ${ACCENTS[accent].tile} ${className}`}
    >
      <Icon className={s.icon} strokeWidth={2.2} />
    </span>
  );
}
