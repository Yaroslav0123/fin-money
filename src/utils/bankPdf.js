/*
 * PDF-выписки банков → таблица строк в том же виде, что после parseCsv.
 * Дальше работает общий разбор (statement.js): типы, переводы, возвраты, повторы и предпросмотр.
 *
 * Выписка по карте Сбербанка: каждая операция — две строки текста.
 *   «28.10.2026 14:05 Супермаркеты 1 250,00 45 300,00» — дата и время, категория банка, сумма, остаток;
 *   «28.10.2026 123456 PRODUKTY Moskva RUS…» — дата обработки, код авторизации (бывает не всегда), описание.
 * Поступления отмечены «+», списания — без знака.
 * Формат взят из общедоступных описаний и проверен на образце samples/sber-vypiska-primer.pdf
 * (вымышленные данные); с настоящей выпиской его нужно сверить.
 */
import { CSV_TEXTS } from '../data/mockData.js';

// Сумма в выписке: «+85 000,00», «2 340,50», «54,00»
const AMOUNT = String.raw`\+?\d{1,3}(?:\s\d{3})*,\d{2}`;
const OPERATION = new RegExp(String.raw`^(\d{2}\.\d{2}\.\d{4})(?:\s+(\d{2}:\d{2}))?\s+(.+?)\s+(${AMOUNT})\s+(${AMOUNT})$`);
const DETAILS = /^\d{2}\.\d{2}\.\d{4}(?:\s+\d{4,}(?=\s|$))?\s*(.*)$/;

// Заголовок таблицы — названия, которые общий разбор находит точным совпадением
const { columns } = CSV_TEXTS;
const HEADER = [columns.date[0], columns.category[0], columns.amount[0], columns.description[0]];

/**
 * Строки текста PDF-выписки Сбербанка → [заголовок, ...строки] или [], если операций не нашлось.
 * Остальной текст (шапка, итоги, номера страниц) пропускается.
 */
export function sberLinesToRows(lines) {
  const rows = [];
  let current = null;
  for (const line of lines) {
    const operation = line.match(OPERATION);
    if (operation) {
      const [, date, time, category, amount] = operation;
      const signed = amount.startsWith('+') ? amount.slice(1) : `-${amount}`;
      current = [time ? `${date} ${time}` : date, category, signed, ''];
      rows.push(current);
      continue;
    }
    // Строка сразу после операции — её описание
    const details = current && line.match(DETAILS);
    if (details) current[3] = details[1];
    current = null;
  }
  return rows.length > 0 ? [HEADER, ...rows] : [];
}
