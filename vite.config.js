import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

// Крупные библиотеки — в отдельные файлы: они меняются реже кода приложения
// и кэшируются браузером отдельно. Ключ — имя файла, значение — пакеты из node_modules.
const VENDOR_CHUNKS = {
  react: ['react', 'react-dom', 'scheduler'],
  charts: [
    'recharts',
    'recharts-scale',
    'd3-*',
    'victory-vendor',
    'lodash',
    'react-smooth',
    'internmap',
    'decimal.js-light',
    'eventemitter3',
    'fast-equals',
    'tiny-invariant',
  ],
  motion: ['framer-motion', 'motion-dom', 'motion-utils'],
  icons: ['lucide-react'],
};

// Имя пакета из пути модуля: «…/node_modules/d3-shape/src/…» → «d3-shape»
const packageName = (id) => id.replace(/\\/g, '/').split('/node_modules/').pop().split('/')[0];

// Пакет подходит под шаблон: точное имя или префикс со звёздочкой («d3-*»)
const matches = (name, pattern) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern);

const manualChunks = (id) => {
  if (!id.includes('node_modules')) return undefined;
  const name = packageName(id);
  return Object.keys(VENDOR_CHUNKS).find((chunk) => VENDOR_CHUNKS[chunk].some((pattern) => matches(name, pattern)));
};

export default defineConfig({
  plugins: [react()],
  // Режим разработки: начинаем обрабатывать модули сразу при старте сервера,
  // а не при первом открытии страницы — первая загрузка заметно быстрее
  server: {
    warmup: { clientFiles: ['./src/main.jsx'] },
  },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
  // Тесты (Vitest): браузерное окружение jsdom, describe/it/expect без импорта
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // Сквозные тесты из e2e/ запускает Playwright, а не Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
