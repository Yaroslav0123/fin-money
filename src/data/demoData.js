/*
 * Генератор демо-данных: история операций за последние 12 месяцев до сегодняшнего дня.
 * Даты всегда «живые» — история строится от текущей даты при первом запуске и при сбросе.
 * Случайность детерминированная (фиксированное зерно), поэтому суммы правдоподобные и
 * повторяются от запуска к запуску. Все деньги виртуальные. Константы ниже — в рублях,
 * а в результат суммы попадают в копейках, как и всё состояние (utils/money.js).
 */
import { DEFAULT_ACCOUNT, DEFAULT_CATEGORIES } from './mockData.js';
import { addDays, addMonths, startOfMonth } from '../utils/dates.js';
import { rub } from '../utils/money.js';

const SEED = 20260528;
const HISTORY_MONTHS = 12;
const ROUND_TO = 10;

// Баланс основного счёта на момент генерации: начальный остаток подбирается под него
const TARGET_BALANCE = 142560;

// Регулярные операции: день месяца, сумма [от, до], час
const SALARY = { days: [5, 20], amount: [37000, 39500], hour: 10 };
const CASHBACK = { day: 1, amount: [300, 900], hour: 9 };
const UTILITIES = { day: 28, amount: [4800, 5600], hour: 12, comment: 'Коммунальные услуги' };
const INTERNET = { day: 15, amount: [1990, 1990], hour: 11, comment: 'Интернет и связь' };
// Ежемесячные пополнения целей (7-го числа)
const GOAL_DEPOSITS = { day: 7, hour: 13, amounts: { trip: 2500, laptop: 5500 } };

// Случайные траты: вероятность в будний / выходной день, сумма [от, до], часы [с, по], подписи
const RANDOM_SPENDING = [
  {
    categoryId: 'food',
    chance: [0.75, 0.9],
    weekdayAmount: [300, 1100],
    weekendAmount: [600, 1900],
    hours: [8, 21],
    comments: ['Супермаркет', 'Кафе', 'Доставка еды', 'Пекарня', 'Обед', ''],
  },
  {
    categoryId: 'transport',
    chance: [0.6, 0.3],
    weekdayAmount: [200, 1100],
    weekendAmount: [200, 1100],
    hours: [7, 22],
    comments: ['Такси', 'Метро', 'Каршеринг', 'Заправка', ''],
  },
  {
    categoryId: 'fun',
    chance: [0.12, 0.55],
    weekdayAmount: [400, 1500],
    weekendAmount: [800, 2600],
    hours: [12, 23],
    comments: ['Кинотеатр', 'Концерт', 'Боулинг', 'Подписка на музыку', 'Настольные игры', ''],
  },
  {
    categoryId: 'other',
    chance: [0.33, 0.4],
    weekdayAmount: [300, 2500],
    weekendAmount: [300, 2500],
    hours: [9, 20],
    comments: ['Аптека', 'Одежда', 'Подарок другу', 'Хозтовары', 'Книги', ''],
  },
];
const FREELANCE = { chance: 0.04, amount: [3000, 12000], hours: [11, 19], comments: ['Заказ на сайт', 'Разовый проект', ''] };

// Месячные лимиты категорий (в рублях): чтобы на «Главной» сразу было видно, как работают бюджеты
const DEMO_BUDGETS = { food: 25000, transport: 9000, fun: 7000 };

// Цели: срок в месяцах от сегодня (отрицательный — уже достигнута), сколько накоплено
const DEMO_GOALS = [
  { id: 'trip', name: 'Путешествие', iconId: 'plane', accent: 'green', target: 100000, saved: 43500, monthsFromNow: 12 },
  { id: 'laptop', name: 'Новый ноутбук', iconId: 'laptop', accent: 'purple', target: 120000, saved: 54000, monthsFromNow: 4 },
  { id: 'car', name: 'Автомобиль', iconId: 'car', accent: 'blue', target: 900000, saved: 180000, monthsFromNow: 27 },
  { id: 'cushion', name: 'Подушка безопасности', iconId: 'shield', accent: 'orange', target: 150000, saved: 150000, monthsFromNow: -7 },
];

// Псевдослучайные числа с зерном (mulberry32): одинаковая последовательность при каждом запуске
const createRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

/**
 * Демо-данные на дату today.
 * Возвращает { accounts, transactions, goals, categories, budgets }.
 * Операции отсортированы от новых к старым, суммы со знаком и в копейках. Демо-счёт один — основной.
 */
export function createDemoData(today = new Date()) {
  const random = createRandom(SEED);
  const between = ([min, max]) => Math.round((min + random() * (max - min)) / ROUND_TO) * ROUND_TO;
  const pick = (items) => items[Math.floor(random() * items.length)];
  const hourIn = ([from, to]) => from + Math.floor(random() * (to - from + 1));

  let counter = 0;
  const nextId = (prefix) => `${prefix}-demo-${(counter += 1)}`;

  const transactions = [];

  // Операция в конкретный день и час (минуты случайные); будущее время пропускаем
  const at = (day, hour) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(random() * 60));
  const push = (tx, date) => {
    if (date <= today) transactions.push({ ...tx, id: nextId('tx'), date: date.toISOString() });
  };

  const start = startOfMonth(addMonths(today, -(HISTORY_MONTHS - 1)));
  for (let day = start; day <= today; day = addDays(day, 1)) {
    const date = day.getDate();
    const weekend = isWeekend(day);

    // Доходы
    if (SALARY.days.includes(date)) {
      push({ type: 'income', categoryId: 'salary', comment: '', amount: between(SALARY.amount) }, at(day, SALARY.hour));
    }
    if (date === CASHBACK.day) {
      push({ type: 'income', categoryId: 'cashback', comment: '', amount: between(CASHBACK.amount) }, at(day, CASHBACK.hour));
    }
    if (random() < FREELANCE.chance) {
      push(
        { type: 'income', categoryId: 'freelance', comment: pick(FREELANCE.comments), amount: between(FREELANCE.amount) },
        at(day, hourIn(FREELANCE.hours)),
      );
    }

    // Обязательные платежи
    for (const bill of [UTILITIES, INTERNET]) {
      if (date === bill.day) {
        push({ type: 'expense', categoryId: 'housing', comment: bill.comment, amount: -between(bill.amount) }, at(day, bill.hour));
      }
    }

    // Повседневные траты
    for (const rule of RANDOM_SPENDING) {
      if (random() < rule.chance[weekend ? 1 : 0]) {
        const amount = between(weekend ? rule.weekendAmount : rule.weekdayAmount);
        push(
          { type: 'expense', categoryId: rule.categoryId, comment: pick(rule.comments), amount: -amount },
          at(day, hourIn(rule.hours)),
        );
      }
    }

    // Пополнение целей — перевод с основного счёта
    if (date === GOAL_DEPOSITS.day) {
      for (const [goalId, amount] of Object.entries(GOAL_DEPOSITS.amounts)) {
        const goalName = DEMO_GOALS.find((g) => g.id === goalId).name;
        push({ type: 'transfer', kind: 'goal', goalId, goalName, amount: -amount }, at(day, GOAL_DEPOSITS.hour));
      }
    }
  }

  const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
  transactions.sort(byDateDesc);

  // Начальный остаток так, чтобы сегодня баланс был ровно TARGET_BALANCE
  const net = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const goals = DEMO_GOALS.map(({ monthsFromNow, target, saved, ...goal }) => ({
    ...goal,
    target: rub(target),
    saved: rub(saved),
    deadline: addMonths(today, monthsFromNow).toISOString(),
  }));

  // Рубли → копейки
  const inKopecks = (tx) => ({ ...tx, amount: rub(tx.amount) });
  return {
    accounts: [{ ...DEFAULT_ACCOUNT, openingBalance: rub(TARGET_BALANCE - net) }],
    transactions: transactions.map((tx) => ({ ...inKopecks(tx), accountId: DEFAULT_ACCOUNT.id })),
    goals,
    categories: DEFAULT_CATEGORIES,
    budgets: Object.fromEntries(Object.entries(DEMO_BUDGETS).map(([id, limit]) => [id, rub(limit)])),
  };
}

// Пустые данные для режима «Начать с нуля»
export function createEmptyData() {
  return {
    accounts: [{ ...DEFAULT_ACCOUNT, openingBalance: 0 }],
    transactions: [],
    goals: [],
    categories: DEFAULT_CATEGORIES,
    budgets: {},
  };
}
