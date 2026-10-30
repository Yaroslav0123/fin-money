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
// Начальный баланс накопительного счёта год назад
const SAVINGS_START = 8000;
const SAVINGS_ANNUAL_RATE = 0.12;
const MONTHS_IN_YEAR = 12;

// Регулярные операции: день месяца, сумма [от, до], час
const SALARY = { days: [5, 20], amount: [37000, 39500], hour: 10 };
const CASHBACK = { day: 1, amount: [300, 900], hour: 9 };
const UTILITIES = { day: 28, amount: [4800, 5600], hour: 12, comment: 'Коммунальные услуги' };
const INTERNET = { day: 15, amount: [1990, 1990], hour: 11, comment: 'Интернет и связь' };
const SAVINGS_DEPOSIT = { day: 12, amount: [3000, 5000], hour: 14 };
const SAVINGS_INTEREST_DAY = 10;
// Снятие с накоплений раз в несколько месяцев
const SAVINGS_WITHDRAW = { everyMonths: 4, day: 25, amount: [2000, 4000], hour: 16 };
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
 * Возвращает { accounts, savingsOpeningBalance, transactions, savingsTransactions, goals, categories }.
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
  const savingsTransactions = [];
  let savingsBalance = SAVINGS_START;

  // Операция в конкретный день и час (минуты случайные); будущее время пропускаем
  const at = (day, hour) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(random() * 60));
  const push = (tx, date) => {
    if (date <= today) transactions.push({ ...tx, id: nextId('tx'), date: date.toISOString() });
  };
  // Возвращает id операции накоплений (для связи с переводом) или null, если дата в будущем
  const pushSavings = (tx, date) => {
    if (date > today) return null;
    const id = nextId('saving');
    savingsTransactions.push({ ...tx, id, date: date.toISOString() });
    savingsBalance += tx.amount;
    return id;
  };

  const start = startOfMonth(addMonths(today, -(HISTORY_MONTHS - 1)));
  for (let day = start; day <= today; day = addDays(day, 1)) {
    const date = day.getDate();
    const weekend = isWeekend(day);
    const monthIndex = (day.getFullYear() - start.getFullYear()) * MONTHS_IN_YEAR + day.getMonth() - start.getMonth();

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

    // Накопительный счёт: проценты, пополнение, редкое снятие
    if (date === SAVINGS_INTEREST_DAY) {
      const interest = Math.round((savingsBalance * SAVINGS_ANNUAL_RATE) / MONTHS_IN_YEAR);
      pushSavings({ type: 'interest', amount: interest }, at(day, 0));
    }
    if (date === SAVINGS_DEPOSIT.day) {
      const amount = between(SAVINGS_DEPOSIT.amount);
      const when = at(day, SAVINGS_DEPOSIT.hour);
      const savingsTxId = pushSavings({ type: 'deposit', amount }, when);
      if (savingsTxId) push({ type: 'transfer', kind: 'savings', mode: 'deposit', savingsTxId, amount: -amount }, when);
    }
    if (date === SAVINGS_WITHDRAW.day && monthIndex % SAVINGS_WITHDRAW.everyMonths === SAVINGS_WITHDRAW.everyMonths - 1) {
      const amount = between(SAVINGS_WITHDRAW.amount);
      const when = at(day, SAVINGS_WITHDRAW.hour);
      const savingsTxId = pushSavings({ type: 'withdraw', amount: -amount }, when);
      if (savingsTxId) push({ type: 'transfer', kind: 'savings', mode: 'withdraw', savingsTxId, amount }, when);
    }
  }

  const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
  transactions.sort(byDateDesc);
  savingsTransactions.sort(byDateDesc);

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
    savingsOpeningBalance: rub(SAVINGS_START),
    transactions: transactions.map((tx) => ({ ...inKopecks(tx), accountId: DEFAULT_ACCOUNT.id })),
    savingsTransactions: savingsTransactions.map(inKopecks),
    goals,
    categories: DEFAULT_CATEGORIES,
  };
}

// Пустые данные для режима «Начать с нуля»
export function createEmptyData() {
  return {
    accounts: [{ ...DEFAULT_ACCOUNT, openingBalance: 0 }],
    savingsOpeningBalance: 0,
    transactions: [],
    savingsTransactions: [],
    goals: [],
    categories: DEFAULT_CATEGORIES,
  };
}
