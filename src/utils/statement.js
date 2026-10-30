/*
 * Операции ↔ строки выписки. Сам CSV — в utils/csv.js, здесь смысл столбцов:
 * какие поля выгружать и как превратить строки банковской выписки в операции Fin Money.
 */
import { AMOUNT_LIMIT, AUTO_CATEGORIES, CSV_TEXTS, IMPORT_FALLBACK_INCOME, MERCHANT_KEY_NOISE } from '../data/mockData.js';
import { detectColumns, normalizeHeader, parseAmount, parseDate } from './csv.js';
import { rub, toRubles } from './money.js';

const pad = (value) => String(value).padStart(2, '0');
// 28.10.2026 14:05 — так дату понимает и Excel, и наш импорт
const formatCsvDate = (date) =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
// Копейки → рубли с запятой и двумя знаками, как в банковских выписках (для Excel с русской локалью)
const formatCsvAmount = (kopecks) => toRubles(kopecks).toFixed(2).replace('.', ',');

/**
 * Строки для выгрузки: заголовок + операции (в виде для списков: title, category, comment…).
 * Сумма со знаком и в рублях с копейками, независимо от выбранной валюты отображения.
 */
export const transactionsToRows = (transactions) => [
  CSV_TEXTS.header,
  ...transactions.map((tx) => [
    formatCsvDate(new Date(tx.date)),
    CSV_TEXTS.types[tx.type],
    tx.category,
    tx.type === 'transfer' ? tx.title : tx.comment ?? '',
    formatCsvAmount(tx.amount),
    tx.accountName ?? '',
  ]),
];

/**
 * Ключ для поиска повторов: дата до минуты, сумма со знаком (в копейках) и описание из выписки.
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

const KEY_NOISE = new Set(MERCHANT_KEY_NOISE);

/**
 * Ключ «магазина» для правил и группировки: описание без цифр (номера карт, коды, даты)
 * и без слов, общих для всех операций. «KOFEYNYA ZERNO Moskva RUS. Операция по карте ****0000» → «kofeynya zerno moskva rus».
 * Пустая строка — описание ничего не говорит о магазине.
 */
export const merchantKey = (description) =>
  normalizeHeader(description ?? '')
    .split(' ')
    .filter((word) => word && !/\d/.test(word) && !KEY_NOISE.has(word))
    .join(' ');

/**
 * Категория по словарю AUTO_CATEGORIES: сначала по категории банка, потом по описанию.
 * Ищем стандартную категорию по id, а если её нет (удалили или пересоздали) — по значку.
 */
export function autoCategory(bankCategory, description, type, categories) {
  const find = (rule) =>
    categories.find((c) => c.id === rule.categoryId && c.type === type) ?? categories.find((c) => c.iconId === rule.iconId && c.type === type);
  const rules = AUTO_CATEGORIES.filter((rule) => rule.type === type);
  for (const text of [normalizeHeader(bankCategory ?? ''), normalizeHeader(description ?? '')]) {
    if (!text) continue;
    for (const rule of rules) {
      const category = hasWord(text, rule.words) && find(rule);
      if (category) return category;
    }
  }
  return null;
}

/**
 * Разбор строк выписки для окна импорта.
 * rows — результат parseCsv; categories — текущие категории; existing — уже сохранённые операции этого счёта;
 * rules — правила пользователя [{ key, value }] (value — id категории или 'transfer'), они важнее всего остального.
 * Категория без правила: то же название, что у категории банка или описания → словарь AUTO_CATEGORIES → «Другое».
 * Возвращает { items, drafts, skipped } или { error: 'noColumns' }.
 * items — все строки файла по порядку: { line, status: 'new' | 'duplicate' | 'skipped', reason?, draft?, cells, key }
 * (key — ключ магазина для правил «запомнить для похожих»).
 * draft — черновик для addTransactions: { type: 'income' | 'expense' | 'transfer', amount (положительное, в копейках),
 * incoming (деньги пришли), categoryId, comment, date, importKey }. Расход с incoming — возврат покупки.
 * Повторы считаются по количеству: две одинаковые поездки в метро за день — две операции,
 * а повтором будет только то, что уже есть в Fin Money.
 */
export function rowsToDrafts(rows, { categories, existing, rules = [], today = new Date() }) {
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

  const ruleByKey = new Map(rules.map((rule) => [rule.key, rule.value]));

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
    const amount = rub(Math.abs(rawAmount));
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
      // Категория банка с тем же названием, описание вида «Зарплата», словарь, иначе «Другое»
      const category =
        names[categoryType][normalizeHeader(bankCategory)] ??
        names[categoryType][normalizeHeader(description)] ??
        autoCategory(bankCategory, description, categoryType, importCategories) ??
        fallback[categoryType];
      categoryId = category.id;
      // Описание, совпадающее с названием категории, не повторяем в комментарии
      if (normalizeHeader(description) === normalizeHeader(category.name)) comment = '';
    }

    // Правило пользователя для этого магазина важнее всего остального
    const merchant = merchantKey(description);
    const base = { type, amount, incoming, categoryId, comment, date, importKey: key };
    const draft = ruleByKey.has(merchant) ? applyCategoryChoice(base, ruleByKey.get(merchant), importCategories) : base;
    const item = { line, status, draft, cells, key: merchant };
    return status === 'duplicate' ? { ...item, reason: 'duplicate' } : item;
  });

  const drafts = items.filter((item) => item.status === 'new').map((item) => item.draft);
  return { items, drafts, skipped: items.length - drafts.length };
}

/**
 * Смена категории черновика (или операции) в окне импорта и при разборе «Другого».
 * value — id категории или 'transfer'. Поступление можно сделать доходом, возвратом в категорию
 * расходов или переводом, списание — расходом или переводом. Неподходящий выбор (списание → доход)
 * и несуществующая категория ничего не меняют.
 */
export const TRANSFER_CHOICE = 'transfer';
export function applyCategoryChoice(draft, value, categories) {
  if (value === TRANSFER_CHOICE) return { ...draft, type: 'transfer', categoryId: null };
  const category = categories.find((c) => c.id === value);
  if (!category || (category.type === 'income' && !draft.incoming)) return draft;
  return { ...draft, type: category.type, categoryId: category.id };
}

// Выбранное значение для выпадающего списка категорий: id категории или 'transfer'
export const categoryChoiceOf = (draft) => (draft.type === 'transfer' ? TRANSFER_CHOICE : draft.categoryId);

/**
 * Разбор «Другого»: импортированные операции без своей категории («Другое», «Прочие доходы» — значок other),
 * сгруппированные по магазину и направлению денег. Самые частые — первыми.
 * Возвращает [{ id, key, incoming, label, ids, total (со знаком), value (текущая категория) }].
 */
export function uncategorizedGroups(transactions, categories) {
  const iconById = Object.fromEntries(categories.map((c) => [c.id, c.iconId]));
  const groups = new Map();
  for (const tx of transactions) {
    const isOther = (iconById[tx.categoryId] ?? 'other') === 'other';
    if (!tx.importId || tx.type === 'transfer' || !isOther) continue;
    const key = merchantKey(tx.comment);
    const incoming = tx.amount > 0;
    const id = `${key || tx.comment || tx.id}|${incoming ? 'in' : 'out'}`;
    const group = groups.get(id) ?? { id, key, incoming, label: tx.comment ?? '', ids: [], total: 0, value: tx.categoryId };
    group.ids.push(tx.id);
    group.total += tx.amount;
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.ids.length - a.ids.length || Math.abs(b.total) - Math.abs(a.total));
}

// Сколько категорий и крупных трат показывать в отчёте после импорта
const REPORT_TOP = 3;

/**
 * Отчёт «Что нашли в выписке» по импортированным черновикам (см. rowsToDrafts).
 * Возвращает { count, period: { from, to } | null, income, expenses, refunds, transfers,
 * topCategories: [{ category, amount, share }], largest: [draft], otherCount }.
 * expenses — списания по покупкам без возвратов; в категориях возвраты уже вычтены.
 * otherCount — сколько операций попало в «Другое» или «Прочие доходы» (их стоит разобрать).
 */
export function importReport(drafts, categories) {
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const times = drafts.map((d) => d.date.getTime());
  const sum = (list) => list.reduce((total, d) => total + d.amount, 0);
  const purchases = drafts.filter((d) => d.type === 'expense' && !d.incoming);
  const refundList = drafts.filter((d) => d.type === 'expense' && d.incoming);
  const expenses = sum(purchases);

  // Траты по категориям за вычетом возвратов
  const byCategory = new Map();
  for (const d of [...purchases, ...refundList]) {
    byCategory.set(d.categoryId, (byCategory.get(d.categoryId) ?? 0) + (d.incoming ? -d.amount : d.amount));
  }
  const topCategories = [...byCategory.entries()]
    .filter(([id, amount]) => amount > 0 && byId[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, REPORT_TOP)
    .map(([id, amount]) => ({ category: byId[id], amount, share: expenses > 0 ? Math.round((amount / expenses) * 100) : 0 }));

  return {
    count: drafts.length,
    period: drafts.length ? { from: new Date(Math.min(...times)), to: new Date(Math.max(...times)) } : null,
    income: sum(drafts.filter((d) => d.type === 'income')),
    expenses,
    refunds: sum(refundList),
    transfers: drafts.filter((d) => d.type === 'transfer').length,
    topCategories,
    largest: [...purchases].sort((a, b) => b.amount - a.amount).slice(0, REPORT_TOP),
    otherCount: drafts.filter((d) => d.type !== 'transfer' && (byId[d.categoryId]?.iconId ?? 'other') === 'other').length,
  };
}
