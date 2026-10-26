// Форматирование чисел для интерфейса

const moneyFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

// 142560 → «142 560 ₽»
export const formatMoney = (value) => `${moneyFormatter.format(value)} ₽`;

// 12340 → «+12 340 ₽», -500 → «−500 ₽»
export const formatSignedMoney = (value) =>
  `${value >= 0 ? '+' : '−'}${formatMoney(Math.abs(value))}`;

// 60000 → «60k» (подписи осей графиков)
export const formatCompact = (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`);

// Текст бейджа динамики: либо проценты, либо сумма + подпись
export const formatTrend = ({ percent, amount, suffix }) => {
  const main =
    percent !== undefined ? `${percent >= 0 ? '+' : '−'}${Math.abs(percent)}%` : formatSignedMoney(amount);
  return suffix ? `${main} ${suffix}` : main;
};

// Процент выполнения цели
export const toPercent = (part, total) => Math.round((part / total) * 100);

// Ежемесячный взнос до цели, округлённый вверх до сотни рублей
const PAYMENT_ROUND_TO = 100;
export const monthlyPayment = (remaining, months) =>
  months > 0 ? Math.ceil(remaining / months / PAYMENT_ROUND_TO) * PAYMENT_ROUND_TO : remaining;

// Пересчёт сумм категорий под другой итог по их долям (округление до 10 ₽).
// Если итог совпадает с исходным — возвращаем категории как есть.
const ROUND_TO = 10;
export const scaleCategories = (categories, total) => {
  const baseTotal = categories.reduce((sum, c) => sum + c.amount, 0);
  if (total === baseTotal) return categories;
  return categories.map((c) => ({
    ...c,
    amount: Math.round((total * c.share) / 100 / ROUND_TO) * ROUND_TO,
  }));
};
