// Форматирование чисел для интерфейса
import { CURRENCIES } from '../data/mockData.js';
import { hasKopecks, rub, toRubles } from './money.js';

const moneyFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const kopecksFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const preciseFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/*
 * Валюта отображения. Все суммы хранятся в копейках (utils/money.js), при показе пересчитываются
 * по условному курсу из CURRENCIES. Текущую валюту задаёт FinanceProvider
 * (настройка «Валюта»), поэтому компоненты продолжают просто вызывать formatMoney.
 */
let displayCurrency = CURRENCIES.rub;
export const setDisplayCurrency = (currencyId) => {
  displayCurrency = CURRENCIES[currencyId] ?? CURRENCIES.rub;
};
export const currencySymbol = () => displayCurrency.symbol;
export const currencyQuickAmounts = (kind = 'quickAmounts') => displayCurrency[kind];

// Копейки → валюта отображения и обратно (для полей ввода сумм)
export const toDisplayAmount = (kopecks) => toRubles(kopecks) * displayCurrency.rate;
export const fromDisplayAmount = (value) => rub(value / displayCurrency.rate);

// 14256000 → «142 560 ₽», 12345 → «123,45 ₽» (или «1 782 $» при валюте «доллар»).
// Копейки показываем, только если они есть: суммы из выписки — точно как в банке.
export const formatMoney = (kopecks) => {
  // «|| 0» превращает −0 в 0, чтобы не показывать «−0 ₽»
  const value = toDisplayAmount(kopecks) || 0;
  let formatter = displayCurrency.rate === 1 || Math.abs(value) >= 100 ? moneyFormatter : preciseFormatter;
  if (displayCurrency.rate === 1 && hasKopecks(Math.round(kopecks))) formatter = kopecksFormatter;
  return `${formatter.format(value)} ${displayCurrency.symbol}`;
};

// Сумма в валюте отображения без пересчёта (быстрые суммы в диалогах уже в этой валюте)
export const formatDisplayMoney = (value) => `${moneyFormatter.format(value)} ${displayCurrency.symbol}`;

// 1234000 → «+12 340 ₽», -50000 → «−500 ₽»
export const formatSignedMoney = (value) =>
  `${value >= 0 ? '+' : '−'}${formatMoney(Math.abs(value))}`;

// 6000000 → «60k» (подписи осей графиков, в валюте отображения)
export const formatCompact = (kopecks) => {
  const value = Math.round(toDisplayAmount(kopecks));
  return Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
};

// Текст бейджа динамики: либо проценты, либо сумма + подпись
export const formatTrend = ({ percent, amount, suffix }) => {
  const main =
    percent !== undefined ? `${percent >= 0 ? '+' : '−'}${Math.abs(percent)}%` : formatSignedMoney(amount);
  return suffix ? `${main} ${suffix}` : main;
};

// Доля в процентах; при нулевом итоге — 0 (а не NaN)
export const toPercent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

// Ежемесячный взнос до цели, округлённый вверх до сотни рублей
const PAYMENT_ROUND_TO = rub(100);
export const monthlyPayment = (remaining, months) =>
  months > 0 ? Math.ceil(remaining / months / PAYMENT_ROUND_TO) * PAYMENT_ROUND_TO : remaining;

// Форма слова для числа: plural(5, ['месяц', 'месяца', 'месяцев']) → «месяцев»
export const plural = (count, [one, few, many]) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// Подстановка значений в шаблон текста: fillTemplate('До «{name}»', { name: 'Отпуск' })
export const fillTemplate = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
