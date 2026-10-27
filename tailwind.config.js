import { colors } from './src/theme/colors.js';

/** @type {import('tailwindcss').Config} */
// Дизайн-система Fin Money: цвета берутся из src/theme/colors.js,
// радиусы и тени задаются здесь, чтобы в JSX были только семантические классы.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors,
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
      // Ширина плавающего демо-переключателя экранов
      maxWidth: {
        phone: '430px',
      },
    },
  },
  plugins: [],
};
