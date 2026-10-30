import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import { decodeCsv, parseAmount, parseCsv, parseDate, toCsv } from './csv.js';
import { applyCategoryChoice, importKey, rowsToDrafts, TRANSFER_CHOICE, transactionsToRows } from './statement.js';

const TODAY = new Date(2026, 9, 28, 18, 0);
const options = { categories: DEFAULT_CATEGORIES, existing: [], today: TODAY };
const parse = (lines) => rowsToDrafts(parseCsv(lines.join('\n')), options);
const short = (drafts) => drafts.map((d) => [d.type, d.amount, d.incoming, d.categoryId]);

// Текст → байты Windows-1251 (кириллица А–я сдвинута на 0x350, остальное — ASCII)
const encode1251 = (text) =>
  Uint8Array.from([...text].map((ch) => {
    const code = ch.charCodeAt(0);
    return code >= 0x410 && code <= 0x44f ? code - 0x350 : code;
  }));

describe('csv', () => {
  it('разбирает кавычки, разделитель «;» и переносы внутри ячеек', () => {
    const rows = parseCsv('﻿Дата;Комментарий\r\n28.10.2026;"Кафе; ""Ромашка""\nс друзьями"\r\n');
    expect(rows).toEqual([
      ['Дата', 'Комментарий'],
      ['28.10.2026', 'Кафе; "Ромашка"\nс друзьями'],
    ]);
  });

  it('выгрузка и разбор дают ту же таблицу', () => {
    const table = [['a', 'b;c'], ['1', 'x"y']];
    expect(parseCsv(toCsv(table))).toEqual(table);
  });

  it('читает файлы в UTF-8 и Windows-1251', () => {
    expect(decodeCsv(new TextEncoder().encode('Дата;Сумма'))).toBe('Дата;Сумма');
    expect(decodeCsv(encode1251('Дата;Сумма'))).toBe('Дата;Сумма');
  });

  it('понимает суммы и даты из выписок', () => {
    expect(parseAmount('−1 234,56 ₽')).toBe(-1234.56);
    expect(parseAmount('-1 234,56')).toBe(-1234.56);
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('1.234,56')).toBe(1234.56);
    expect(parseAmount('500.00')).toBe(500);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseDate('28.10.2026 14:05')).toEqual(new Date(2026, 9, 28, 14, 5));
    expect(parseDate('28.10.2026 14:05:59')).toEqual(new Date(2026, 9, 28, 14, 5));
    expect(parseDate('27.10.26')).toEqual(new Date(2026, 9, 27, 12, 0));
    expect(parseDate('2026-10-28')).toEqual(new Date(2026, 9, 28, 12, 0));
    expect(parseDate('31.02.2026')).toBeNull();
  });
});

describe('выписка → операции', () => {
  it('знак суммы, категория по названию, остальное — в «Другое»', () => {
    const { drafts, items, skipped } = parse([
      'Дата операции,Сумма операции,Описание,Категория',
      '27.10.2026,-450,Кофейня,Еда',
      '26.10.2026,"-1 200,50",Аптека,Здоровье',
      '25.10.2026,50000,Зарплата,',
      '24.10.2026,3000,Анна К.,',
      '01.11.2026,-100,Из будущего,Еда',
    ]);
    expect(skipped).toBe(1);
    expect(items.at(-1)).toMatchObject({ line: 6, status: 'skipped', reason: 'future' });
    expect(drafts.map((d) => [d.type, d.amount, d.categoryId, d.comment])).toEqual([
      ['expense', 450, 'food', 'Кофейня'],
      ['expense', 1201, 'other', 'Аптека'],
      // Описание совпало с категорией дохода
      ['income', 50000, 'salary', ''],
      // Нераспознанное поступление — не «Зарплата», а «Прочие доходы»
      ['income', 3000, 'other-income', 'Анна К.'],
    ]);
  });

  it('выписка вида Т-Банка: сумма в рублях, неудачные операции, переводы между своими счетами, возвраты', () => {
    const { items, drafts } = parse([
      'Дата операции;Дата платежа;Номер карты;Статус;Сумма операции;Валюта операции;Сумма платежа;Валюта платежа;Категория;MCC;Описание',
      '27.10.2026 19:10:00;27.10.2026;*1234;OK;-20,00;EUR;-1 950,00;RUB;Рестораны;5812;Cafe Berlin',
      '27.10.2026 12:00:00;27.10.2026;*1234;FAILED;-5 000,00;RUB;-5 000,00;RUB;Супермаркеты;5411;Перекрёсток',
      '26.10.2026 09:00:00;26.10.2026;;OK;-10 000,00;RUB;-10 000,00;RUB;Переводы;;Между своими счетами',
      '25.10.2026 15:30:00;25.10.2026;*1234;OK;990,00;RUB;990,00;RUB;Одежда и обувь;5651;Возврат покупки Lamoda',
      '24.10.2026 08:15:00;24.10.2026;*1234;OK;-2 500,00;RUB;-2 500,00;RUB;Переводы;;Иван П.',
    ]);
    expect(items.map((i) => i.status)).toEqual(['new', 'skipped', 'new', 'new', 'new']);
    expect(items[1].reason).toBe('failed');
    expect(short(drafts)).toEqual([
      // Покупка за 20 € — в рублях по «Сумме платежа»
      ['expense', 1950, false, 'other'],
      ['transfer', 10000, false, null],
      // Возврат — расход с плюсом: уменьшает траты
      ['expense', 990, true, 'other'],
      // Перевод другому человеку — это трата
      ['expense', 2500, false, 'other'],
    ]);
  });

  it('выписка вида Альфа-Банка: «Приход» и «Расход» отдельно, «Тип счёта» — не тип операции', () => {
    const { drafts } = parse([
      'Тип счёта;Номер счета;Валюта;Дата операции;Описание операции;Приход;Расход',
      'Текущий счёт;40817;RUR;27.10.26;Пятёрочка;0;812,40',
      'Текущий счёт;40817;RUR;26.10.26;Зарплата за октябрь;85 000,00;0',
    ]);
    expect(short(drafts)).toEqual([
      ['expense', 812, false, 'other'],
      ['income', 85000, true, 'other-income'],
    ]);
  });

  it('одинаковые операции в файле не теряются, повтором считается только уже загруженное', () => {
    const lines = ['Дата;Сумма;Описание', '27.10.2026;-54;Метро', '27.10.2026;-54;Метро'];
    expect(parse(lines).drafts).toHaveLength(2);

    // Одна поездка уже есть (её комментарий потом поменяли — ключ импорта сохранился)
    const date = new Date(2026, 9, 27, 12, 0);
    const existing = [{ type: 'expense', amount: -54, comment: 'Метро до работы', date: date.toISOString(), importKey: importKey(date, -54, 'Метро') }];
    const { items } = rowsToDrafts(parseCsv(lines.join('\n')), { ...options, existing });
    expect(items.map((i) => i.status)).toEqual(['duplicate', 'new']);
  });

  it('своя выгрузка загружается обратно без повторов', () => {
    const transactions = [
      { type: 'expense', category: 'Еда', comment: 'Обед', amount: -700, date: new Date(2026, 9, 27, 13, 0).toISOString() },
      { type: 'expense', category: 'Еда', comment: 'Возврат', amount: 300, date: new Date(2026, 9, 27, 14, 0).toISOString() },
      { type: 'transfer', category: 'Накопления', title: 'Пополнение накоплений', amount: -3000, date: new Date(2026, 9, 26).toISOString() },
    ];
    const rows = parseCsv(toCsv(transactionsToRows(transactions)));
    const first = rowsToDrafts(rows, options);
    expect(short(first.drafts)).toEqual([
      ['expense', 700, false, 'food'],
      ['expense', 300, true, 'food'],
      ['transfer', 3000, false, null],
    ]);

    // Те же операции уже есть — всё повторы
    const existing = transactions.map((tx) => ({ ...tx, categoryId: 'food' }));
    const again = rowsToDrafts(rows, { ...options, existing });
    expect(again.drafts).toHaveLength(0);
    expect(again.items.every((i) => i.reason === 'duplicate')).toBe(true);
  });

  it('без столбцов даты и суммы — ошибка', () => {
    expect(rowsToDrafts(parseCsv('Имя;Город\nМаша;Москва'), options)).toEqual({ error: 'noColumns' });
  });

  it('категорию в предпросмотре можно сменить или сделать строку переводом', () => {
    const draft = { type: 'income', amount: 990, incoming: true, categoryId: 'other-income' };
    expect(applyCategoryChoice(draft, 'food', DEFAULT_CATEGORIES)).toMatchObject({ type: 'expense', categoryId: 'food', incoming: true });
    expect(applyCategoryChoice(draft, TRANSFER_CHOICE, DEFAULT_CATEGORIES)).toMatchObject({ type: 'transfer', categoryId: null });
  });
});
