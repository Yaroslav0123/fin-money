/*
 * Операции ↔ строки выписки. Сам CSV — в utils/csv.js, здесь смысл столбцов:
 * какие поля выгружать и как превратить строки банковской выписки в операции Fin Money.
 */
import { AMOUNT_LIMIT, CSV_TEXTS } from '../data/mockData.js';
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

// Ключ для поиска повторов: дата до минуты, сумма и комментарий
const duplicateKey = (date, amount, comment) => `${formatCsvDate(date)}|${amount}|${(comment ?? '').trim().toLowerCase()}`;

/**
 * Разбор строк выписки в черновики операций для addTransactions.
 * rows — результат parseCsv; categories — текущие категории; existing — уже сохранённые операции
 * (повторы пропускаем). Переводы, будущие даты, нули и строки с ошибками тоже пропускаются.
 * Возвращает { drafts, skipped } или { error: 'noColumns' }.
 */
export function rowsToDrafts(rows, { categories, existing, today = new Date() }) {
  if (rows.length < 2) return { error: 'noColumns' };
  const columns = detectColumns(rows[0], CSV_TEXTS.columns);
  if (columns.date < 0 || columns.amount < 0) return { error: 'noColumns' };

  const byName = (type) =>
    Object.fromEntries(categories.filter((c) => c.type === type).map((c) => [normalizeHeader(c.name), c]));
  const names = { income: byName('income'), expense: byName('expense') };
  const fallback = {
    expense: categories.find((c) => c.type === 'expense' && c.iconId === 'other') ?? categories.find((c) => c.type === 'expense'),
    income: categories.find((c) => c.type === 'income'),
  };
  const seen = new Set(existing.map((tx) => duplicateKey(new Date(tx.date), tx.amount, tx.comment ?? '')));
  const hasWord = (text, words) => words.some((w) => text.includes(w));

  const drafts = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const cell = (key) => (columns[key] >= 0 ? (row[columns[key]] ?? '').trim() : '');
    const date = parseDate(cell('date'));
    const rawAmount = parseAmount(cell('amount'));
    const typeText = normalizeHeader(cell('type'));

    if (!date || date > today || !rawAmount || hasWord(typeText, CSV_TEXTS.transferWords)) {
      skipped += 1;
      continue;
    }
    // Направление: по столбцу «Тип», если он есть, иначе по знаку суммы
    const isIncome = typeText ? hasWord(typeText, CSV_TEXTS.incomeWords) : rawAmount > 0;
    const type = isIncome ? 'income' : 'expense';
    const amount = Math.round(Math.abs(rawAmount));
    if (amount === 0 || amount > AMOUNT_LIMIT.max) {
      skipped += 1;
      continue;
    }

    const category = names[type][normalizeHeader(cell('category'))] ?? fallback[type];
    const description = cell('description');
    // Описание, совпадающее с названием категории, не повторяем в комментарии
    const comment = normalizeHeader(description) === normalizeHeader(category.name) ? '' : description;
    const signed = isIncome ? amount : -amount;
    const key = duplicateKey(date, signed, comment);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    drafts.push({ type, amount, categoryId: category.id, comment, date });
  }
  return { drafts, skipped };
}
