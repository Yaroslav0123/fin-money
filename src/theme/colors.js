// Единый источник цветов. Используется и в tailwind.config.js (классы),
// и в графиках Recharts, которым нужны HEX-значения.
export const colors = {
  // Брендовый зелёный и его оттенки
  brand: {
    DEFAULT: '#1A5D46',
    dark: '#134634',
    light: '#E7F1EC',
    soft: '#CFE3D8',
    muted: '#8FB9A4',
  },
  // Фоны
  canvas: '#E9ECEA', // фон вокруг «телефона» на десктопе
  surface: '#F8F9FA', // основной фон приложения
  line: '#E6E9EC', // тонкие разделители и сетка графиков
  // Текст
  ink: {
    DEFAULT: '#14201B',
    secondary: '#4B5563',
    muted: '#8A9099',
  },
  // Позитивные / негативные бейджи
  positive: { DEFAULT: '#1F8A5B', bg: '#E3F4EA' },
  negative: { DEFAULT: '#D64545', bg: '#FCE8E8' },
  // Акцентные цвета для графиков и категорий
  accent: {
    blue: '#4C8DF6',
    green: '#3DB37A',
    orange: '#F5A54A',
    pink: '#EF6B8A',
    purple: '#9B6BF2',
    gray: '#B8BEC6',
  },
};
