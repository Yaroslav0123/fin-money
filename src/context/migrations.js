/*
 * Обновление сохранённых данных до текущего формата.
 * Каждый шаг переводит данные из версии N в N + 1, поэтому сохранённое любой старой версией
 * приложения доходит до текущей по цепочке, ничего не теряя.
 *
 * Версии:
 * 2 — история операций с датами, суммы в рублях, один основной счёт (openingBalance);
 * 3 — суммы в копейках (utils/money.js);
 * 4 — несколько счетов: accounts [{ id, name, openingBalance }], у операции и импорта — accountId;
 * 5 — без накопительного счёта (Fin Money — учёт и прогноз, а не банк).
 */
import { DEFAULT_ACCOUNT } from '../data/mockData.js';
import { rub } from '../utils/money.js';

export const CURRENT_VERSION = 5;
// Данные без поля version сохранены версией 2
const UNVERSIONED = 2;

const withAmount = (item) => ({ ...item, amount: rub(item.amount) });

// Ключ повторов импорта — «дата|сумма|описание»: сумму в нём тоже переводим в копейки
const importKeyInKopecks = (key) => {
  const [date, amount, ...description] = key.split('|');
  return [date, rub(Number(amount)), ...description].join('|');
};

const STEPS = {
  // Рубли → копейки: все суммы, цели и лимит бюджета
  2: (data) => ({
    ...data,
    openingBalance: rub(data.openingBalance),
    savingsOpeningBalance: rub(data.savingsOpeningBalance ?? 0),
    transactions: data.transactions.map((tx) => {
      const next = withAmount(tx);
      return tx.importKey ? { ...next, importKey: importKeyInKopecks(tx.importKey) } : next;
    }),
    savingsTransactions: (data.savingsTransactions ?? []).map(withAmount),
    goals: data.goals.map((goal) => ({ ...goal, target: rub(goal.target), saved: rub(goal.saved) })),
    settings: data.settings?.budgetLimit === undefined ? data.settings : { ...data.settings, budgetLimit: rub(data.settings.budgetLimit) },
  }),
  // Один счёт → список счетов: прежний баланс становится основным счётом
  3: ({ openingBalance, ...data }) => ({
    ...data,
    accounts: [{ ...DEFAULT_ACCOUNT, openingBalance }],
    transactions: data.transactions.map((tx) => ({ ...tx, accountId: DEFAULT_ACCOUNT.id })),
    imports: (data.imports ?? []).map((item) => ({ ...item, accountId: DEFAULT_ACCOUNT.id })),
  }),
  // Накопительного счёта больше нет: его история удаляется вместе с переводами на него и с него,
  // поэтому отложенные туда деньги возвращаются на основной счёт
  4: (data) => {
    const result = { ...data, transactions: data.transactions.filter((tx) => tx.kind !== 'savings') };
    delete result.savingsOpeningBalance;
    delete result.savingsTransactions;
    return result;
  },
};

// Данные любой версии → текущая. Версия новее известной (сохранена будущей версией) не трогается.
export function migrateState(data) {
  let version = data.version ?? UNVERSIONED;
  let result = data;
  while (version < CURRENT_VERSION) {
    result = STEPS[version](result);
    version += 1;
  }
  return { ...result, version };
}
