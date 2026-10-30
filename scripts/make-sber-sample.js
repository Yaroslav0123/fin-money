/*
 * Образец PDF-выписки по карте в формате, похожем на выписку Сбербанка, — для проверки импорта.
 * Все данные вымышленные: владелец, карта, магазины и суммы.
 * Раскладка повторяет общеизвестную структуру выписки (дата и время, категория, сумма, остаток;
 * под ними — дата обработки, код авторизации и описание). С настоящим файлом банка её нужно сверить.
 *
 * Запуск: node scripts/make-sber-sample.js (PDF печатает Chromium из Playwright;
 * если скачанный Chromium не запускается, PW_CHANNEL=chrome — установленный Chrome).
 * Результат: samples/sber-vypiska-primer.pdf и его копия в public/ (кнопки «Пример выписки» на сайте и в приложении)
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const OUTPUT = 'samples/sber-vypiska-primer.pdf';
const PUBLIC_COPY = 'public/sber-vypiska-primer.pdf';
const OPENING_BALANCE = 20000;

// [дата и время, категория, сумма со знаком, код авторизации, описание]
const OPERATIONS = [
  ['01.09.2026 10:15', 'Зарплата', 85000, '', 'ООО «Ромашка». Заработная плата за август'],
  ['02.09.2026 18:40', 'Супермаркеты', -2340.5, '214365', 'PRODUKTY U DOMA Moskva RUS. Операция по карте ****0000'],
  ['03.09.2026 08:12', 'Транспорт', -54, '587120', 'METRO Moskva RUS. Операция по карте ****0000'],
  ['03.09.2026 08:12', 'Транспорт', -54, '587121', 'METRO Moskva RUS. Операция по карте ****0000'],
  ['05.09.2026 13:30', 'Рестораны и кафе', -680, '330912', 'KOFEYNYA ZERNO Moskva RUS. Операция по карте ****0000'],
  ['07.09.2026 20:00', 'Перевод с карты', -3000, '', 'Перевод для А. Анна Сергеевна'],
  ['10.09.2026 09:00', 'Перевод с карты', -10000, '', 'Перевод между своими счетами. На накопительный счёт ****1111'],
  ['12.09.2026 16:45', 'Одежда и обувь', -4990, '771204', 'MODNY DOM Moskva RUS. Операция по карте ****0000'],
  ['15.09.2026 11:20', 'Прочие поступления', 4990, '771204', 'Возврат покупки. MODNY DOM Moskva RUS'],
  ['20.09.2026 19:05', 'Перевод на карту', 1500, '', 'Перевод от И. Иван Петрович'],
  ['25.09.2026 12:00', 'Коммунальные платежи', -6200, '', 'Оплата ЖКУ. Лицевой счёт 0000000000'],
  ['01.10.2026 10:00', 'Зарплата', 85000, '', 'ООО «Ромашка». Заработная плата за сентябрь'],
  ['03.10.2026 18:05', 'Супермаркеты', -3115.9, '402211', 'PRODUKTY U DOMA Moskva RUS. Операция по карте ****0000'],
  ['10.10.2026 09:30', 'Здоровье и красота', -1250, '118733', 'APTEKA ZDOROVYE Moskva RUS. Операция по карте ****0000'],
  ['15.10.2026 21:10', 'Рестораны и кафе', -2100, '900145', 'KAFE U REKI Moskva RUS. Операция по карте ****0000'],
  ['20.10.2026 07:50', 'Транспорт', -650, '650098', 'TAKSI GOROD Moskva RUS. Операция по карте ****0000'],
];

// 1234.5 → «1 234,50»; поступления со знаком «+», списания без знака — как в выписке банка
const money = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value).replace(/\s/g, ' ');
const signed = (value) => (value > 0 ? `+${money(value)}` : money(-value));

const rows = [];
let balance = OPENING_BALANCE;
for (const [dateTime, category, amount, code, description] of OPERATIONS) {
  balance += amount;
  const processed = dateTime.slice(0, 10);
  rows.push(`
    <tr class="main"><td>${dateTime}</td><td>${category}</td><td class="num">${signed(amount)}</td><td class="num">${money(balance)}</td></tr>
    <tr class="sub"><td>${processed}${code ? ` ${code}` : ''}</td><td colspan="3">${description}</td></tr>`);
}
const income = OPERATIONS.filter((op) => op[2] > 0).reduce((sum, op) => sum + op[2], 0);
const outcome = OPERATIONS.filter((op) => op[2] < 0).reduce((sum, op) => sum - op[2], 0);

const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; font-size: 10px; color: #222; margin: 0; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  .note { color: #b00; font-weight: bold; margin: 0 0 10px; }
  .meta p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; font-size: 8px; color: #666; border-bottom: 1px solid #999; padding: 4px 6px; }
  td { padding: 3px 6px; white-space: nowrap; }
  tr.sub td { color: #666; font-size: 9px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .num { text-align: right; }
</style></head><body>
  <h1>Выписка по счёту дебетовой карты</h1>
  <p class="note">ОБРАЗЕЦ С ВЫМЫШЛЕННЫМИ ДАННЫМИ для проверки импорта Fin Money</p>
  <div class="meta">
    <p>Владелец счёта: Иванова Мария Петровна</p>
    <p>Карта: МИР Классическая •••• 0000</p>
    <p>Период: 01.09.2026 — 27.10.2026</p>
    <p>Остаток на 01.09.2026: ${money(OPENING_BALANCE)}</p>
    <p>Пополнение: ${money(income)} Списание: ${money(outcome)}</p>
    <p>Остаток на 27.10.2026: ${money(balance)}</p>
  </div>
  <table>
    <thead>
      <tr><th>ДАТА ОПЕРАЦИИ (МСК)</th><th>КАТЕГОРИЯ</th><th class="num">СУММА В ВАЛЮТЕ СЧЁТА</th><th class="num">ОСТАТОК СРЕДСТВ В ВАЛЮТЕ СЧЁТА</th></tr>
      <tr><th>Дата обработки и код авторизации</th><th colspan="3">Описание операции</th></tr>
    </thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</body></html>`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage();
await page.setContent(html);
await mkdir('samples', { recursive: true });
await page.pdf({ path: OUTPUT, format: 'A4', margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' } });
await browser.close();
await copyFile(OUTPUT, PUBLIC_COPY);
console.log(`Готово: ${OUTPUT}, операций: ${OPERATIONS.length}`);
