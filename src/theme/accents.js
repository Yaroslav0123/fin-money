import { colors } from './colors.js';

// Стили акцентных цветов: HEX для графиков и готовые классы Tailwind
// для иконок-«плиток» и точек легенды. Классы перечислены целиком,
// чтобы Tailwind их нашёл при сборке.
export const ACCENTS = {
  // Белая плитка — для размещения на цветных панелях
  white: { hex: colors.brand.DEFAULT, tile: 'bg-white text-brand shadow-soft', dot: 'bg-white' },
  brand: { hex: colors.brand.DEFAULT, tile: 'bg-brand-light text-brand', dot: 'bg-brand' },
  green: { hex: colors.accent.green, tile: 'bg-accent-green/15 text-accent-green', dot: 'bg-accent-green' },
  blue: { hex: colors.accent.blue, tile: 'bg-accent-blue/15 text-accent-blue', dot: 'bg-accent-blue' },
  purple: { hex: colors.accent.purple, tile: 'bg-accent-purple/15 text-accent-purple', dot: 'bg-accent-purple' },
  orange: { hex: colors.accent.orange, tile: 'bg-accent-orange/15 text-accent-orange', dot: 'bg-accent-orange' },
  pink: { hex: colors.accent.pink, tile: 'bg-accent-pink/15 text-accent-pink', dot: 'bg-accent-pink' },
  gray: { hex: colors.accent.gray, tile: 'bg-black/5 text-ink-secondary', dot: 'bg-accent-gray' },
};
