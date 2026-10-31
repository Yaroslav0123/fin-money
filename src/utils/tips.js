/*
 * Советы на «Главной»: короткие выводы из истории операций и прогноза месяца.
 * Цифры считает utils/finance.js, здесь — только выбор советов и тексты из mockData.
 */
import { DASHBOARD, DATE_TEXTS } from '../data/mockData.js';
import { categoryGrowth, goalPace, goalSpeedup, insightData, regularPayments } from './finance.js';
import { fillTemplate, formatMoney, monthlyPayment, plural } from './format.js';
import { KOPECKS_IN_RUBLE } from './money.js';

// Сколько советов показывать и сколько регулярных платежей перечислять в одном совете
const MAX_TIPS = 4;
const REGULAR_SHOWN = 3;
// «Если тратить на 10% меньше…»
const CUT_PERCENT = 10;
// Сумму экономии округляем до 100 ₽ — так её проще представить
const CUT_ROUND_TO = 100 * KOPECKS_IN_RUBLE;

// Коэффициент для текста: 1.47 → «1,5»
const ratioFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

const monthsText = (count) => `${count} ${plural(count, DATE_TEXTS.monthWords)}`;

/**
 * Список советов: [{ id, icon, accent, text }], сначала самые полезные.
 * forecast — результат monthForecast() за текущий месяц.
 */
export function buildTips({ transactions, categories, goals, today, forecast }) {
  const t = DASHBOARD.tips;
  const items = [];
  const data = insightData(transactions, categories, goals, today);

  // Категория, которая в этом месяце заметно обгоняет свой обычный уровень
  const growth = categoryGrowth(forecast, categories);
  if (growth) {
    const values = { name: growth.category.name, projected: formatMoney(growth.projected), percent: growth.percent, usual: formatMoney(growth.usual) };
    items.push({ id: 'growth', ...t.growth, text: fillTemplate(t.growth.text, values) });
  }

  // Регулярные платежи и подписки из выписки
  const regular = regularPayments(transactions, today);
  if (regular.length > 0) {
    const list = regular
      .slice(0, REGULAR_SHOWN)
      .map((item) => `${item.name} (${formatMoney(item.monthly)})`)
      .join(', ');
    const total = regular.reduce((sum, item) => sum + item.monthly, 0);
    items.push({ id: 'regular', ...t.regular, text: fillTemplate(t.regular.text, { list, total: formatMoney(total) }) });
  }

  // Ближайшая цель придёт раньше, если немного урезать самую крупную категорию трат
  const goal = data.nextGoal;
  const [topId, top] = Object.entries(forecast.categories)
    .filter(([, c]) => c.usual > 0)
    .sort((a, b) => b[1].usual - a[1].usual)[0] ?? [];
  const topCategory = categories.find((c) => c.id === topId);
  if (goal && topCategory) {
    const extra = Math.round((top.usual * CUT_PERCENT) / 100 / CUT_ROUND_TO) * CUT_ROUND_TO;
    const months = goalSpeedup(goal, goalPace(goal, today), extra);
    if (months >= 1) {
      const values = { category: topCategory.name, percent: CUT_PERCENT, amount: formatMoney(extra), goal: goal.name, months: monthsText(months) };
      items.push({ id: 'speedup', ...t.speedup, text: fillTemplate(t.speedup.text, values) });
    }
  }

  if (data.hasPreviousMonth && data.monthDiff !== 0) {
    const rule = data.monthDiff < 0 ? t.less : t.more;
    items.push({ id: 'month', ...rule, text: fillTemplate(rule.text, { amount: formatMoney(Math.abs(data.monthDiff)) }) });
  }
  if (data.topCategory) {
    const { name, share, icon, accent } = data.topCategory;
    items.push({ id: 'top', icon, accent, text: fillTemplate(t.top.text, { name, share }) });
  }
  if (data.weekendRatio) {
    const rule = data.weekendRatio > 1 ? t.weekendMore : t.weekdayMore;
    const ratio = data.weekendRatio > 1 ? data.weekendRatio : 1 / data.weekendRatio;
    items.push({ id: 'weekend', ...rule, text: fillTemplate(rule.text, { ratio: ratioFormatter.format(ratio) }) });
  }
  if (goal) {
    const payment = formatMoney(monthlyPayment(goal.left, goal.monthsLeft));
    items.push({ id: 'goal', ...t.goal, text: fillTemplate(t.goal.text, { name: goal.name, left: formatMoney(goal.left), payment }) });
  }
  return items.slice(0, MAX_TIPS);
}
