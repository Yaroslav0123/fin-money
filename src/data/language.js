/*
 * Язык интерфейса. Он выбирается до загрузки текстов: mockData.js сразу собирается на нужном языке,
 * поэтому компоненты по-прежнему просто импортируют константы. Смена языка перезагружает страницу.
 * Хранится отдельно от данных (свой ключ в localStorage): язык нужен раньше, чем прочитано состояние.
 * Хранилище может быть недоступно — тогда интерфейс просто на русском.
 */
export const LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE = 'ru';
const LANGUAGE_KEY = 'fin-money:lang';

const readLanguage = () => {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export const LANGUAGE = typeof window === 'undefined' ? DEFAULT_LANGUAGE : readLanguage();
export const isEnglish = LANGUAGE === 'en';
// Локаль для чисел и дат (Intl)
export const LOCALE = isEnglish ? 'en-US' : 'ru-RU';

// Сменить язык: запоминаем и перезагружаем страницу (тот же адрес — тот же экран лендинга или «Как это сделано»)
export const changeLanguage = (language) => {
  if (language === LANGUAGE || !LANGUAGES.includes(language)) return;
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Без хранилища язык не запомнится — остаёмся на текущем
    return;
  }
  window.location.reload();
};
