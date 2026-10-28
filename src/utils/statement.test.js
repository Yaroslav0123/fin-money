import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import { parseAmount, parseCsv, parseDate, toCsv } from './csv.js';
import { rowsToDrafts, transactionsToRows } from './statement.js';

const TODAY = new Date(2026, 9, 28, 18, 0);
const options = { categories: DEFAULT_CATEGORIES, existing: [], today: TODAY };

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

  it('понимает суммы и даты из выписок', () => {
    expect(parseAmount('−1 234,56 ₽')).toBe(-1234.56);
    expect(parseAmount('500.00')).toBe(500);
    expect(parseAmount('abc')).toBeNull();
    expect(parseDate('28.10.2026 14:05')).toEqual(new Date(2026, 9, 28, 14, 5));
    expect(parseDate('2026-10-28')).toEqual(new Date(2026, 9, 28, 12, 0));
    expect(parseDate('31.02.2026')).toBeNull();
  });
});

describe('выписка → операции', () => {
  it('банковская выписка: знак суммы, категория по названию, остальное — в «Другое»', () => {
    const rows = parseCsv(
      [
        'Дата операции,Сумма операции,Описание,Категория',
        '27.10.2026,-450,Кофейня,Еда',
        '26.10.2026,"-1 200,50",Аптека,Здоровье',
        '25.10.2026,50000,Зарплата,',
        '01.11.2026,-100,Из будущего,Еда',
      ].join('\n'),
    );
    const { drafts, skipped } = rowsToDrafts(rows, options);
    expect(skipped).toBe(1);
    expect(drafts.map((d) => [d.type, d.amount, d.categoryId, d.comment])).toEqual([
      ['expense', 450, 'food', 'Кофейня'],
      ['expense', 1201, 'other', 'Аптека'],
      ['income', 50000, 'salary', ''],
    ]);
  });

  it('своя выгрузка загружается обратно, переводы и повторы пропускаются', () => {
    const transactions = [
      { type: 'expense', category: 'Еда', comment: 'Обед', amount: -700, date: new Date(2026, 9, 27, 13, 0).toISOString() },
      { type: 'transfer', category: 'Накопления', title: 'Пополнение накоплений', amount: -3000, date: new Date(2026, 9, 26).toISOString() },
    ];
    const rows = parseCsv(toCsv(transactionsToRows(transactions)));
    const first = rowsToDrafts(rows, options);
    expect(first.drafts).toHaveLength(1);
    expect(first.drafts[0]).toMatchObject({ type: 'expense', amount: 700, categoryId: 'food', comment: 'Обед' });
    expect(first.skipped).toBe(1);

    // Уже есть такая операция — повтор
    const existing = [{ ...transactions[0], categoryId: 'food' }];
    expect(rowsToDrafts(rows, { ...options, existing }).drafts).toHaveLength(0);
  });

  it('без столбцов даты и суммы — ошибка', () => {
    expect(rowsToDrafts(parseCsv('Имя;Город\nМаша;Москва'), options)).toEqual({ error: 'noColumns' });
  });
});
