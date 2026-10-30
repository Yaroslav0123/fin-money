import { DEFAULT_CATEGORIES } from '../data/mockData.js';
import { decodeCsv, parseAmount, parseCsv, parseDate, toCsv } from './csv.js';
import { rub } from './money.js';
import {
  applyCategoryChoice,
  importKey,
  merchantKey,
  rowsToDrafts,
  TRANSFER_CHOICE,
  transactionsToRows,
  uncategorizedGroups,
} from './statement.js';

const TODAY = new Date(2026, 9, 28, 18, 0);
const options = { categories: DEFAULT_CATEGORIES, existing: [], today: TODAY };
const parse = (lines) => rowsToDrafts(parseCsv(lines.join('\n')), options);
// Суммы черновиков — в копейках, в ожиданиях пишем рубли
const short = (drafts) => drafts.map((d) => [d.type, d.amount / 100, d.incoming, d.categoryId]);

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
      ['expense', rub(450), 'food', 'Кофейня'],
      // Копейки сохраняются точно
      ['expense', 120050, 'other', 'Аптека'],
      // Описание совпало с категорией дохода
      ['income', rub(50000), 'salary', ''],
      // Нераспознанное поступление — не «Зарплата», а «Прочие доходы»
      ['income', rub(3000), 'other-income', 'Анна К.'],
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
      // Покупка за 20 € — в рублях по «Сумме платежа»; «Рестораны» по словарю — «Еда»
      ['expense', 1950, false, 'food'],
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
      ['expense', 812.4, false, 'other'],
      // «Зарплата за октябрь» — по словарю
      ['income', 85000, true, 'salary'],
    ]);
  });

  it('одинаковые операции в файле не теряются, повтором считается только уже загруженное', () => {
    const lines = ['Дата;Сумма;Описание', '27.10.2026;-54;Метро', '27.10.2026;-54;Метро'];
    expect(parse(lines).drafts).toHaveLength(2);

    // Одна поездка уже есть (её комментарий потом поменяли — ключ импорта сохранился)
    const date = new Date(2026, 9, 27, 12, 0);
    const existing = [{ type: 'expense', amount: rub(-54), comment: 'Метро до работы', date: date.toISOString(), importKey: importKey(date, rub(-54), 'Метро') }];
    const { items } = rowsToDrafts(parseCsv(lines.join('\n')), { ...options, existing });
    expect(items.map((i) => i.status)).toEqual(['duplicate', 'new']);
  });

  it('своя выгрузка загружается обратно без повторов', () => {
    const transactions = [
      { type: 'expense', category: 'Еда', comment: 'Обед', amount: rub(-700.5), date: new Date(2026, 9, 27, 13, 0).toISOString(), accountName: 'Карта' },
      { type: 'expense', category: 'Еда', comment: 'Возврат', amount: rub(300), date: new Date(2026, 9, 27, 14, 0).toISOString() },
      { type: 'transfer', category: 'Накопления', title: 'Пополнение накоплений', amount: rub(-3000), date: new Date(2026, 9, 26).toISOString() },
    ];
    const rows = parseCsv(toCsv(transactionsToRows(transactions)));
    // Сумма — рубли с копейками, как в банковских выписках; последний столбец — счёт
    expect(rows[1].slice(-2)).toEqual(['-700,50', 'Карта']);
    const first = rowsToDrafts(rows, options);
    expect(short(first.drafts)).toEqual([
      ['expense', 700.5, false, 'food'],
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
    // Списание не может стать доходом
    const purchase = { type: 'expense', amount: 500, incoming: false, categoryId: 'other' };
    expect(applyCategoryChoice(purchase, 'salary', DEFAULT_CATEGORIES)).toBe(purchase);
  });
});

describe('автокатегории', () => {
  it('ключ магазина — без цифр, номеров карт и общих слов; возврат совпадает с покупкой', () => {
    expect(merchantKey('KOFEYNYA ZERNO Moskva RUS. Операция по карте ****0000')).toBe('kofeynya zerno moskva rus');
    expect(merchantKey('Возврат покупки. MODNY DOM Moskva RUS')).toBe(merchantKey('MODNY DOM Moskva RUS. Операция по карте ****0000'));
    expect(merchantKey('ООО «Ромашка». Заработная плата за август')).toBe(merchantKey('ООО «Ромашка». Заработная плата за сентябрь'));
    expect(merchantKey('123456')).toBe('');
  });

  it('словарь: по категории банка, потом по описанию; переименованная категория находится по значку', () => {
    const { drafts } = parse([
      'Дата;Сумма;Категория;Описание',
      '27.10.2026;-1200;Супермаркеты;Магазин у дома',
      '27.10.2026;-300;;TAKSI GOROD',
      '27.10.2026;-6200;Коммунальные платежи, связь, интернет;ЖКУ',
      '27.10.2026;-900;Кино;Билеты',
      '26.10.2026;350;;Кэшбэк за покупки',
      '26.10.2026;-500;Одежда;Футболка',
    ]);
    expect(drafts.map((d) => d.categoryId)).toEqual(['food', 'transport', 'housing', 'fun', 'cashback', 'other']);

    // Пользователь пересоздал «Еду» под другим id и названием — та же иконка
    const categories = [...DEFAULT_CATEGORIES.filter((c) => c.id !== 'food'), { id: 'category-7', type: 'expense', name: 'Продукты и кафе', iconId: 'food', accent: 'green' }];
    const again = rowsToDrafts(parseCsv('Дата;Сумма;Категория\n27.10.2026;-1200;Супермаркеты'), { ...options, categories });
    expect(again.drafts[0].categoryId).toBe('category-7');
  });

  it('правила пользователя важнее словаря и подходят к возвратам', () => {
    const rules = [
      { key: 'modny dom moskva rus', value: 'fun' },
      { key: 'produkty u doma', value: TRANSFER_CHOICE },
    ];
    const rows = parseCsv(
      [
        'Дата;Сумма;Категория;Описание',
        '27.10.2026;-4990;Одежда;MODNY DOM Moskva RUS. Операция по карте ****0000',
        '27.10.2026;4990;Прочие поступления;Возврат покупки. MODNY DOM Moskva RUS',
        '27.10.2026;-1200;Супермаркеты;PRODUKTY U DOMA',
      ].join('\n'),
    );
    const { drafts, items } = rowsToDrafts(rows, { ...options, rules });
    expect(short(drafts)).toEqual([
      ['expense', 4990, false, 'fun'],
      ['expense', 4990, true, 'fun'],
      ['transfer', 1200, false, null],
    ]);
    expect(items[0].key).toBe('modny dom moskva rus');
  });

  it('«Другое» из выписок группируется по магазину и направлению', () => {
    const tx = (id, amount, comment, categoryId = 'other', importId = 'import-1') => ({ id, type: amount > 0 ? 'income' : 'expense', amount, comment, categoryId, importId });
    const transactions = [
      tx('a', -54, 'APTEKA Moskva ****0000'),
      tx('b', -120, 'APTEKA Moskva ****1111'),
      tx('c', 1500, 'Перевод от И. Иван Петрович', 'other-income'),
      tx('d', -300, 'Еда', 'food'),
      // Добавлено вручную, а не из выписки — не трогаем
      tx('e', -200, 'Что-то', 'other', null),
    ];
    const categories = [...DEFAULT_CATEGORIES, { id: 'other-income', type: 'income', name: 'Прочие доходы', iconId: 'other' }];
    const groups = uncategorizedGroups(transactions, categories);
    expect(groups.map((g) => [g.key, g.incoming, g.ids, g.total])).toEqual([
      ['apteka moskva', false, ['a', 'b'], -174],
      ['перевод от и иван петрович', true, ['c'], 1500],
    ]);
  });
});
