/*
 * Операции ↔ строки выписки. Сам CSV — в utils/csv.js, здесь смысл столбцов:
 * какие поля выгружать и как превратить строки банковской выписки в операции Fin Money.
 */
import { AMOUNT_LIMIT, CSV_TEXTS, IMPORT_FALLBACK_INCOME } from '../data/mockData.js';
import { detectColumns, normalizeHeader, parseAmount, parseDate } from './csv.js';

const pad = (value) => String(value).padStart(2, '0');
// 28.10.2026 14:05 — так дату понимает и Excel, и наш импорт
const formatCsvDate = (date) =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
// Сумма в рублях с запятой в дробной части (для Excel с русской локалью)
const formatCsvAmount = (amount) => String(amount).replace('.', ',');

/**
 * Строки для выгрузки: заголовок + операции (в виде для списков: title, category, comment…).
 * Сумма со знаком и в рублях, независимо от выбранной валюты отображения.
 */
export const transactionsToRows = (transactions) => [
  CSV_TEXTS.header,
  ...transactions.map((tx) => [
    formatCsvDate(new Date(tx.date)),
    CSV_TEXTS.types[tx.type],
    tx.category,
    tx.type === 'transfer' ? tx.title : tx.comment ?? '',
    formatCsvAmount(tx.amount),
  ]),
];

/**
 * Ключ для поиска повторов: дата до минуты, сумма со знаком и описание из выписки.
 * У переводов описание не сравниваем: в своей выгрузке это название перевода, а в самой операции его нет.
 * Импортированная операция хранит ключ (importKey), поэтому правка категории или комментария
 * не мешает узнать её при повторной загрузке.
 */
export const importKey = (date, signedAmount, description, isTransfer = false) =>
  `${formatCsvDate(date)}|${signedAmount}|${isTransfer ? '' : normalizeHeader(description ?? '')}`;

const keyOfTransaction = (tx) => tx.importKey ?? importKey(new Date(tx.date), tx.amount, tx.comment, tx.type === 'transfer');

/**
 * Категории для импорта: к своим добавляем «Прочие доходы», если категории дохода «Другое» нет.
 * Иначе нераспознанный перевод от друга попал бы в «Зарплату».
 */
export const withImportCategories = (categories) =>
  categories.some((c) => c.type === 'income' && c.iconId === 'other') ? categories : [...categories, IMPORT_FALLBACK_INCOME];

// Сумма операции со знаком: поступления (доход, возврат, входящий перевод) — плюс
export const signedDraftAmount = (draft) => (draft.incoming ? draft.amount : -draft.amount);

const hasWord = (text, words) => words.some((w) => text.includes(w));

/**
 * Разбор строк выписки для окна импорта.
 * rows — результат parseCsv; categories — текущие категории; existing — уже сохранённые операции.
 * Возвращает { items, drafts, skipped } или { error: 'noColumns' }.
 * items — все строки файла по порядку: { line, status: 'new' | 'duplicate' | 'skipped', reason?, draft?, cells }.
 * draft — черновик для addTransactions: { type: 'income' | 'expense' | 'transfer', amount (положительное),
 * incoming (деньги пришли), categoryId, comment, date, importKey }. Расход с incoming — возврат покупки.
 * Повторы считаются по количеству: две одинаковые поездки в метро за день — две операции,
 * а повтором будет только то, что уже есть в Fin Money.
 */
export function rowsToDrafts(rows, { categories, existing, today = new Date() }) {
  if (rows.length < 2) return { error: 'noColumns' };
  const columns = detectColumns(rows[0], CSV_TEXTS.columns, { exactOnly: CSV_TEXTS.exactColumns });
  const hasAmount = columns.amount >= 0 || columns.credit >= 0 || columns.debit >= 0;
  if (columns.date < 0 || !hasAmount) return { error: 'noColumns' };

  const importCategories = withImportCategories(categories);
  const byName = (type) =>
    Object.fromEntries(importCategories.filter((c) => c.type === type).map((c) => [normalizeHeader(c.name), c]));
  const names = { income: byName('income'), expense: byName('expense') };
  const fallback = {
    expense: importCategories.find((c) => c.type === 'expense' && c.iconId === 'other') ?? importCategories.find((c) => c.type === 'expense'),
    income: importCategories.find((c) => c.type === 'income' && c.iconId === 'other'),
  };

  // Сколько раз каждая операция уже есть в Fin Money
  const existingCount = new Map();
  existing.forEach((tx) => {
    const key = keyOfTransaction(tx);
    existingCount.set(key, (existingCount.get(key) ?? 0) + 1);
  });

  const items = rows.slice(1).map((row, index) => {
    const cell = (key) => (columns[key] >= 0 ? (row[columns[key]] ?? '').trim() : '');
    const line = index + 2;
    const description = cell('description');
    const cells = { date: cell('date'), description, amount: cell('amount') || cell('credit') || cell('debit') };
    const skip = (reason) => ({ line, status: 'skipped', reason, cells });

    // Сумма: один столбец со знаком или «Приход» и «Расход» отдельно
    const amountCell = parseAmount(cell('amount'));
    const credit = parseAmount(cell('credit'));
    const debit = parseAmount(cell('debit'));
    const rawAmount = columns.amount >= 0 ? amountCell : credit || debit ? (credit ?? 0) - Math.abs(debit ?? 0) : null;
    const date = parseDate(cell('date'));

    if (hasWord(normalizeHeader(cell('status')), CSV_TEXTS.failedWords)) return skip('failed');
    if (!date || !rawAmount) return skip('invalid');
    if (date > today) return skip('future');
    const amount = Math.round(Math.abs(rawAmount));
    if (amount === 0) return skip('invalid');
    if (amount > AMOUNT_LIMIT.max) return skip('tooLarge');

    // Тип: по столбцу «Тип», если он есть (наша выгрузка), иначе по знаку суммы и словам в описании
    const typeText = normalizeHeader(cell('type'));
    const bankCategory = cell('category');
    const text = normalizeHeader(`${description} ${bankCategory}`);
    let type;
    let incoming;
    if (typeText) {
      if (hasWord(typeText, CSV_TEXTS.transferWords)) {
        type = 'transfer';
        incoming = rawAmount > 0;
      } else {
        type = hasWord(typeText, CSV_TEXTS.incomeWords) ? 'income' : 'expense';
        // Расход с плюсом — возврат покупки
        incoming = type === 'income' || rawAmount > 0;
      }
    } else {
      incoming = rawAmount > 0;
      if (hasWord(text, CSV_TEXTS.ownTransferWords)) type = 'transfer';
      else if (incoming && !hasWord(text, CSV_TEXTS.refundWords)) type = 'income';
      else type = 'expense';
    }

    const signed = incoming ? amount : -amount;
    const key = importKey(date, signed, description, type === 'transfer');
    const status = existingCount.get(key) > 0 ? 'duplicate' : 'new';
    if (status === 'duplicate') existingCount.set(key, existingCount.get(key) - 1);

    let categoryId = null;
    let comment = description;
    if (type !== 'transfer') {
      const categoryType = type === 'expense' ? 'expense' : 'income';
      // Категория банка с тем же названием, иначе описание вида «Зарплата», иначе «Другое»
      const category =
        names[categoryType][normalizeHeader(bankCategory)] ?? names[categoryType][normalizeHeader(description)] ?? fallback[categoryType];
      categoryId = category.id;
      // Описание, совпадающее с названием категории, не повторяем в комментарии
      if (normalizeHeader(description) === normalizeHeader(category.name)) comment = '';
    }

    const draft = { type, amount, incoming, categoryId, comment, date, importKey: key };
    return status === 'duplicate' ? { line, status, reason: 'duplicate', draft, cells } : { line, status, draft, cells };
  });

  const drafts = items.filter((item) => item.status === 'new').map((item) => item.draft);
  return { items, drafts, skipped: items.length - drafts.length };
}

/**
 * Смена категории черновика в окне импорта. value — id категории или 'transfer'.
 * Поступление можно сделать доходом, возвратом в категорию расходов или переводом,
 * списание — расходом или переводом.
 */
export const TRANSFER_CHOICE = 'transfer';
export function applyCategoryChoice(draft, value, categories) {
  if (value === TRANSFER_CHOICE) return { ...draft, type: 'transfer', categoryId: null };
  const category = categories.find((c) => c.id === value);
  if (!category) return draft;
  return { ...draft, type: category.type, categoryId: category.id };
}
