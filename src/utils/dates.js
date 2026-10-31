// Работа с датами. Все расчёты — в местном времени пользователя.
import { DATE_TEXTS } from '../data/mockData.js';

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

// Начало дня (00:00) для даты
export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes());

// Сдвиг на месяцы. День месяца ограничиваем последним днём (31 янв + 1 мес → 28/29 фев).
export const addMonths = (date, months) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes());
  const lastDay = daysInMonth(target);
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

// Начало недели. weekStart — 'mon' или 'sun'.
export const startOfWeek = (date, weekStart) => {
  const firstDay = weekStart === 'sun' ? 0 : 1;
  const shift = (date.getDay() - firstDay + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  return addDays(startOfDay(date), -shift);
};

export const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

// Полных дней между датами (по календарю, без учёта часов)
export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / MS_IN_DAY);

// Полных месяцев от from до to (сколько раз можно прибавить месяц, не перескочив to)
export const monthsBetween = (from, to) => {
  let months = (to.getFullYear() - from.getFullYear()) * MONTHS_IN_YEAR + to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
};

// Попадает ли дата в полуинтервал [start, end)
export const isInRange = (date, start, end) => date >= start && date < end;

// ───── Подписи ─────

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayMonthYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const weekdayLong = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });

// Название месяца в именительном падеже: «октябрь»
export const monthName = (date) => DATE_TEXTS.months[date.getMonth()];

// Короткое название месяца для осей графиков: «Окт»
export const monthShort = (date) => DATE_TEXTS.monthsShort[date.getMonth()];

// Короткий день недели: «Пн»
export const weekdayShort = (date) => DATE_TEXTS.weekdaysShort[date.getDay()];

// «12 октября» или «12 октября 2025», если год не текущий
export const formatDay = (date, today = new Date()) =>
  (date.getFullYear() === today.getFullYear() ? dayMonth : dayMonthYear).format(date);

// «12 октября 2027» — всегда с годом (сроки целей)
export const formatFullDate = (date) => dayMonthYear.format(date);

// Дата операции в списке: «Сегодня, 14:05», «Вчера, 09:15», «12 октября, 18:40»
export const formatTransactionDate = (date, today = new Date()) => {
  const diff = daysBetween(date, today);
  const day = diff === 0 ? DATE_TEXTS.today : diff === 1 ? DATE_TEXTS.yesterday : formatDay(date, today);
  return `${day}, ${time.format(date)}`;
};

// Заголовок группы операций в полном списке: «Сегодня», «Вчера», «вторник, 12 октября»
export const formatGroupDate = (date, today = new Date()) => {
  const diff = daysBetween(date, today);
  if (diff === 0) return DATE_TEXTS.today;
  if (diff === 1) return DATE_TEXTS.yesterday;
  return `${weekdayLong.format(date)}, ${formatDay(date, today)}`;
};

// Диапазон: «1–28 октября 2026», «27 сент. – 3 окт.», «ноябрь 2025 — октябрь 2026»
const rangeFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDateRange = (start, lastDay) =>
  isSameDay(start, lastDay) ? formatFullDate(start) : rangeFormatter.formatRange(start, lastDay);

// Период из месяцев: «ноябрь 2025 — октябрь 2026»
export const formatMonthRange = (start, last) =>
  `${monthName(start)} ${start.getFullYear()} — ${monthName(last)} ${last.getFullYear()}`;

// Значение для <input type="date">: «2026-10-28»
const pad = (value) => String(value).padStart(2, '0');
export const toDateInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Обратно из <input type="date"> с сохранением времени исходной даты
export const fromDateInputValue = (value, timeSource = new Date()) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, timeSource.getHours(), timeSource.getMinutes());
};
