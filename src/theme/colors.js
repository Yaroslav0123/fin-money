// Единый источник цветов. Используется и в tailwind.config.js (классы),
// и в графиках Recharts.
//
// Цвета интерфейса меняются вместе с темой: для каждой темы своя палитра (palettes),
// а Tailwind и графики берут цвет из CSS-переменной (--c-brand, --c-ink…).
// Переменные объявляются в tailwind.config.js для :root (светлая) и .dark (тёмная).

// Палитры тем. Ключи — «пути» токенов: 'brand' = brand.DEFAULT, 'brand-dark' = brand.dark.
export const palettes = {
  light: {
    brand: '#1A5D46',
    // Заливка под белым текстом (кнопки, активные вкладки); в светлой теме совпадает с brand
    'brand-fill': '#1A5D46',
    'brand-dark': '#134634',
    'brand-light': '#E7F1EC',
    'brand-soft': '#CFE3D8',
    'brand-muted': '#8FB9A4',
    canvas: '#E9ECEA', // фон страницы
    surface: '#F8F9FA', // основной фон приложения
    card: '#FFFFFF', // карточки и окна
    line: '#E6E9EC', // тонкие разделители и сетка графиков
    ink: '#14201B',
    'ink-secondary': '#4B5563',
    'ink-muted': '#656B74', // затемнён до контраста 4.5:1 (WCAG AA) на белом и surface
    positive: '#1B7950',
    'positive-bg': '#E3F4EA',
    negative: '#C62C2C',
    'negative-bg': '#FCE8E8',
    overlay: '#14201B', // затемнение под окнами
  },
  dark: {
    // brand — для текста и графиков (контраст 4.5:1 на card и brand-light),
    // brand-fill — под белым текстом (5:1); на brand белый текст читался бы плохо
    brand: '#38A880',
    'brand-fill': '#237A5B',
    'brand-dark': '#1D6A4F',
    'brand-light': '#1C2E27',
    'brand-soft': '#24443A',
    'brand-muted': '#4E8C72',
    canvas: '#0B100E',
    surface: '#111715',
    card: '#19211E',
    line: '#2A3430',
    ink: '#E8EEEA',
    'ink-secondary': '#B4BEB9',
    'ink-muted': '#8E9A94', // контраст 4.5:1 на card
    positive: '#4CC48A',
    'positive-bg': '#173326',
    negative: '#F07B7B',
    'negative-bg': '#3A1E1E',
    overlay: '#000000',
  },
};

// Акцентные цвета графиков и категорий — одинаковые в обеих темах
const accent = {
  blue: '#4C8DF6',
  green: '#3DB37A',
  orange: '#F5A54A',
  pink: '#EF6B8A',
  purple: '#9B6BF2',
  gray: '#B8BEC6',
};

// Цвет токена для SVG и инлайн-стилей: меняется вместе с темой
export const themeColor = (token) => `rgb(var(--c-${token}))`;

// Классы Tailwind: brand, brand-dark, ink-muted… → цвет из переменной с поддержкой прозрачности (bg-ink/5)
const themed = (token) => `rgb(var(--c-${token}) / <alpha-value>)`;
export const tailwindColors = {
  brand: {
    DEFAULT: themed('brand'),
    fill: themed('brand-fill'),
    dark: themed('brand-dark'),
    light: themed('brand-light'),
    soft: themed('brand-soft'),
    muted: themed('brand-muted'),
  },
  canvas: themed('canvas'),
  surface: themed('surface'),
  card: themed('card'),
  line: themed('line'),
  ink: { DEFAULT: themed('ink'), secondary: themed('ink-secondary'), muted: themed('ink-muted') },
  positive: { DEFAULT: themed('positive'), bg: themed('positive-bg') },
  negative: { DEFAULT: themed('negative'), bg: themed('negative-bg') },
  overlay: themed('overlay'),
  accent,
  // Корпус ноутбука на лендинге — тёмный в обеих темах
  device: '#14201B',
};

// Значения CSS-переменных палитры: { '--c-brand': '26 93 70', … }
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
export const cssVariables = (palette) =>
  Object.fromEntries(Object.entries(palette).map(([token, hex]) => [`--c-${token}`, toRgb(hex)]));

// Цвета для графиков (SVG): через переменные, поэтому подстраиваются под тему
export const colors = {
  brand: {
    DEFAULT: themeColor('brand'),
    dark: themeColor('brand-dark'),
    light: themeColor('brand-light'),
    soft: themeColor('brand-soft'),
    muted: themeColor('brand-muted'),
  },
  line: themeColor('line'),
  ink: { DEFAULT: themeColor('ink'), muted: themeColor('ink-muted') },
  accent,
};
