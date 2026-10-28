/*
 * Экспорт и импорт операций в CSV.
 * Формат выгрузки рассчитан на Excel с русской локалью: разделитель «;», дробная часть через запятую,
 * в начале файла BOM, чтобы кириллица открылась без «кракозябр».
 * Импорт понимает и свой формат, и типичные выписки банков: ищет столбцы даты, суммы,
 * описания и категории по названиям, разделитель определяет сам.
 */

const BOM = '\uFEFF';
const DELIMITERS = [';', ',', '\t'];

// Значение ячейки: в кавычки, если внутри разделитель, кавычка или перенос строки
const escapeCell = (value, delimiter) => {
  const text = String(value ?? '');
  return /["\n\r]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Таблица → текст CSV (первая строка — заголовки)
export const toCsv = (rows, delimiter = ';') =>
  BOM + rows.map((row) => row.map((cell) => escapeCell(cell, delimiter)).join(delimiter)).join('\r\n');

// Разделитель — тот, которого больше всего в первой строке
const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/, 1)[0];
  return DELIMITERS.reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best));
};

// Текст CSV → массив строк-массивов (с учётом кавычек и переносов внутри ячеек)
export const parseCsv = (input) => {
  const text = input.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

// ───── Разбор значений из выписок ─────

// «1 234,56», «-500.00», «−1 200 ₽» → число (null, если не число)
export const parseAmount = (value) => {
  const cleaned = String(value)
    .replace(/[\s\u00A0₽$€]|руб\.?|RUB/gi, '')
    .replace('−', '-')
    .replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
};

// «28.10.2026», «28.10.2026 14:05», «2026-10-28», «2026-10-28T14:05:00» → Date (null, если не дата)
export const parseDate = (value) => {
  const text = String(value).trim();
  const ru = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  let parts = null;
  if (ru) {
    const year = ru[3].length === 2 ? 2000 + Number(ru[3]) : Number(ru[3]);
    parts = [year, Number(ru[2]), Number(ru[1]), ru[4], ru[5]];
  } else if (iso) {
    parts = [Number(iso[1]), Number(iso[2]), Number(iso[3]), iso[4], iso[5]];
  }
  if (!parts) return null;
  const [year, month, day, hour, minute] = parts;
  // Без времени — полдень, чтобы операция не «уехала» на соседний день
  const date = new Date(year, month - 1, day, hour ? Number(hour) : 12, minute ? Number(minute) : 0);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

// Нормализация заголовка: «Сумма операции, ₽» → «сумма операции»
const normalize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Номера столбцов по заголовкам. columnNames — { date: ['дата', …], amount: […], … }.
 * Сначала ищем точное совпадение, потом — заголовок, который начинается с варианта.
 */
export const detectColumns = (header, columnNames) => {
  const normalized = header.map(normalize);
  const result = {};
  for (const [key, variants] of Object.entries(columnNames)) {
    const exact = normalized.findIndex((h) => variants.includes(h));
    const partial = normalized.findIndex((h) => variants.some((v) => h.startsWith(v)));
    result[key] = exact >= 0 ? exact : partial;
  }
  return result;
};

export { normalize as normalizeHeader };
