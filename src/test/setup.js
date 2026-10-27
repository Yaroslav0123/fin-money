// Дополнительные проверки для тестов: toBeDisabled, toHaveTextContent и т. п.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Демо-данные сохраняются в localStorage — каждый тест начинает с чистого браузера
afterEach(() => window.localStorage.clear());
