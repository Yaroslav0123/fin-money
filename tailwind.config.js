import plugin from 'tailwindcss/plugin';
import { cssVariables, palettes, tailwindColors, themeColor } from './src/theme/colors.js';

/** @type {import('tailwindcss').Config} */
// Дизайн-система Fin Money: цвета берутся из src/theme/colors.js,
// радиусы и тени задаются здесь, чтобы в JSX были только семантические классы.
// Тёмная тема — класс .dark на <html> (его ставит FinanceProvider по настройке «Тема»).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: tailwindColors,
      borderRadius: {
        card: '20px',
        panel: '28px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(20, 32, 27, 0.06)',
        lifted: '0 12px 32px rgba(20, 32, 27, 0.10)',
        laptop: '0 40px 80px -20px rgba(20, 32, 27, 0.35)',
        button: '0 8px 20px rgba(26, 93, 70, 0.28)',
      },
    },
  },
  plugins: [
    // Переменные палитры для светлой и тёмной темы; отступ колец фокуса — цвета карточки
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...cssVariables(palettes.light), colorScheme: 'light' },
        '.dark': { ...cssVariables(palettes.dark), colorScheme: 'dark' },
        '*': { '--tw-ring-offset-color': themeColor('card') },
      });
    }),
  ],
};
