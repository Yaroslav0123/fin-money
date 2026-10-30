import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { money, openAppWithDemo } from './helpers.js';

// Основные сценарии на широком экране. Каждый тест начинает с чистого браузера (пустой localStorage).

test('лендинг открывается и ведёт в приложение с демо-данными', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fin Money' })).toBeVisible();
  await openAppWithDemo(page);
  await expect(page.getByRole('main').getByText(money('142 560')).first()).toBeVisible();
});

test('все разделы меню открываются', async ({ page }) => {
  await openAppWithDemo(page);
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  for (const label of ['Аналитика', 'Накопления', 'Цели', 'Настройки', 'Главная']) {
    await nav.getByRole('button', { name: label }).click();
    await expect(nav.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('новая операция меняет баланс и сохраняется после обновления', async ({ page }) => {
  await openAppWithDemo(page);
  await page.getByRole('button', { name: 'Добавить операцию' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Новая операция' });
  await dialog.getByLabel('Сумма').fill('500');
  await dialog.getByRole('button', { name: 'Добавить', exact: true }).click();

  await expect(page.getByRole('status').getByText('Операция добавлена')).toBeVisible();
  await expect(page.getByRole('main').getByText(money('142 060')).first()).toBeVisible();

  // После обновления страницы открывается сайт; знакомство второй раз не показывается
  await page.reload();
  await page.getByRole('button', { name: 'Мои финансы' }).first().click();
  await expect(page.getByRole('main').getByText(money('142 060')).first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('тёмная тема включается и не сбрасывается после обновления', async ({ page }) => {
  await openAppWithDemo(page);
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click();
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  await expect(html).toHaveClass(/dark/);
});

test('экспорт CSV и повторный импорт того же файла не создаёт повторов', async ({ page }) => {
  await openAppWithDemo(page);
  // Поиск в шапке открывает экран «Операции» с запросом
  await page.getByRole('searchbox', { name: 'Поиск операций' }).fill('Метро');
  await page.getByRole('searchbox', { name: 'Поиск операций' }).press('Enter');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспорт CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fin-money-operations-\d{4}-\d{2}-\d{2}\.csv$/);

  // Файл для Excel: BOM в начале, разделитель «;», в каждой строке — метро
  const text = await readFile(await download.path(), 'utf8');
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const lines = text.slice(1).trim().split('\r\n');
  expect(lines[0]).toContain(';');
  expect(lines.length).toBeGreaterThan(1);
  for (const line of lines.slice(1)) expect(line).toContain('Метро');

  await page.getByRole('button', { name: 'Импорт выписки' }).click();
  const dialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await dialog.locator('input[type="file"]').setInputFiles(await download.path());
  await expect(dialog.getByRole('alert')).toHaveText('В файле нет операций, которые можно добавить.');
});

test('PDF-выписка Сбербанка (образец с вымышленными данными): импорт и защита от повторов', async ({ page }) => {
  await openAppWithDemo(page);
  await page.getByRole('searchbox', { name: 'Поиск операций' }).press('Enter');
  const sample = 'samples/sber-vypiska-primer.pdf';

  await page.getByRole('button', { name: 'Импорт выписки' }).click();
  const dialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await dialog.locator('input[type="file"]').setInputFiles(sample);
  await expect(dialog.getByText('К импорту: 16 из 16')).toBeVisible();
  await expect(dialog.getByText('Переводов между своими счетами: 1 — в доходы и расходы не входят')).toBeVisible();
  await expect(dialog.getByText('Возвраты покупок: 4 990 ₽ — уменьшат расходы')).toBeVisible();

  // Автокатегории: «Супермаркеты» → «Еда», «Коммунальные платежи» → «Жильё»
  await expect(dialog.getByLabel('Категория строки 3')).toHaveValue('food');
  await expect(dialog.getByLabel('Категория строки 12')).toHaveValue('housing');
  // Покупка одежды → «Развлечения»: возврат того же магазина меняется следом, выбор запоминается
  await dialog.getByLabel('Категория строки 9').selectOption({ label: 'Развлечения' });
  await expect(dialog.getByLabel('Категория строки 10')).toHaveValue('fun');
  await expect(dialog.getByText('Запомним для похожих операций в следующих выписках: 1')).toBeVisible();
  await dialog.getByRole('button', { name: 'Импортировать' }).click();
  await expect(page.getByRole('status').getByText('Импортировано операций: 16')).toBeVisible();

  // Отчёт «Что нашли в выписке»: период, главная категория и сколько осталось без категории
  await expect(dialog.getByText('Что нашли в выписке')).toBeVisible();
  await expect(dialog.getByText(/1 сентября — 20 октября 2026/)).toBeVisible();
  await expect(dialog.getByText('Больше всего потратили')).toBeVisible();
  await expect(dialog.getByText(/Без своей категории: 3 операции/)).toBeVisible();

  // Остались без категории: перевод человеку, аптека и входящий перевод — разбираем прямо из отчёта
  await dialog.getByRole('button', { name: 'Разобрать «Другое»' }).click();
  const sort = page.getByRole('dialog', { name: 'Разобрать «Другое»' });
  await sort.getByLabel(/APTEKA/).selectOption({ label: 'Развлечения' });
  await sort.getByLabel(/Перевод от/).selectOption({ label: 'Подарок' });
  await sort.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByRole('status').getByText('Категории обновлены: 2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Разобрать «Другое» (1)' })).toBeVisible();

  // 142 560 + поступления 176 490 − списания 34 434,40 — до копейки, как в выписке
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('284 615,60')).first()).toBeVisible();

  // Запомненные правила видны в «Настройках»
  await nav.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.getByText('→ Подарок')).toBeVisible();
  await expect(page.getByText('→ Развлечения')).toHaveCount(2);

  // Тот же файл ещё раз — всё уже есть
  await page.getByRole('searchbox', { name: 'Поиск операций' }).press('Enter');
  await page.getByRole('button', { name: 'Импорт выписки' }).click();
  await dialog.locator('input[type="file"]').setInputFiles(sample);
  await expect(dialog.getByRole('alert')).toHaveText('В файле нет операций, которые можно добавить.');
});

// Текст → байты Windows-1251: так выгружают выписки многие банки
const encode1251 = (text) =>
  Buffer.from([...text].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code === 0x451) return 0xb8; // ё
    return code >= 0x410 && code <= 0x44f ? code - 0x350 : code;
  }));

test('выписка банка: проверка строк, импорт и его отмена', async ({ page }) => {
  await openAppWithDemo(page);
  await page.getByRole('searchbox', { name: 'Поиск операций' }).press('Enter');

  // Вымышленная выписка за позавчера: покупка, перевод между своими счетами, возврат и неудачная операция
  const day = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const date = `${String(day.getDate()).padStart(2, '0')}.${String(day.getMonth() + 1).padStart(2, '0')}.${day.getFullYear()}`;
  const csv = [
    'Дата операции;Статус;Сумма платежа;Категория;Описание',
    `${date} 10:00:00;OK;-350,00;Рестораны;Кофейня у дома`,
    `${date} 11:00:00;OK;-5 000,00;Переводы;Между своими счетами`,
    `${date} 12:00:00;OK;990,00;Одежда;Возврат покупки`,
    `${date} 13:00:00;FAILED;-700,00;Такси;Поездка`,
  ].join('\r\n');

  await page.getByRole('button', { name: 'Импорт выписки' }).click();
  const dialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'bank.csv', mimeType: 'text/csv', buffer: encode1251(csv) });

  await expect(dialog.getByText('К импорту: 3 из 3')).toBeVisible();
  await expect(dialog.getByText('Кофейня у дома')).toBeVisible();
  await expect(dialog.getByText(/Не импортируется строк: 1/)).toBeVisible();

  // Покупку — в «Еду», возврат не берём
  await dialog.getByLabel('Категория строки 2').selectOption({ label: 'Еда' });
  await dialog.getByLabel('Импортировать строку 4').uncheck();
  await expect(dialog.getByText('К импорту: 2 из 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'Импортировать' }).click();
  await expect(page.getByRole('status').getByText('Импортировано операций: 2')).toBeVisible();
  await dialog.getByRole('button', { name: 'Готово' }).click();

  // 142 560 − 350 − 5 000
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('137 210')).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('tab', { name: 'Данные' }).click();
  await page.getByRole('button', { name: 'Отменить импорт bank.csv' }).click();
  await page.getByRole('dialog', { name: 'Отменить импорт «bank.csv»?' }).getByRole('button', { name: 'Удалить операции' }).click();
  await expect(page.getByText('Выписок пока не загружали.')).toBeVisible();

  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('142 560')).first()).toBeVisible();
});

test('несколько счетов: остаток с копейками, выписка на свой счёт, удаление счёта', async ({ page }) => {
  await openAppWithDemo(page);
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  const main = page.getByRole('main');

  // Новый счёт с начальным остатком
  await nav.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('heading', { name: 'Счета' }).locator('..').getByRole('button', { name: 'Добавить' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новый счёт' });
  await dialog.getByLabel('Название').fill('Наличные');
  await dialog.getByLabel(/Начальный остаток/).fill('1500,50');
  await dialog.getByRole('button', { name: 'Добавить' }).click();
  await expect(page.getByRole('status').getByText('Счёт добавлен')).toBeVisible();

  // На «Главной» — общий баланс и сколько на каждом счёте
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(main.getByText(money('144 060,50')).first()).toBeVisible();
  const byAccount = main.getByRole('definition').filter({ hasText: /1\s500,50/ });
  await expect(byAccount).toBeVisible();

  // Выписка — на счёт «Наличные»
  await page.getByRole('searchbox', { name: 'Поиск операций' }).press('Enter');
  await page.getByRole('button', { name: 'Импорт выписки' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await importDialog.getByLabel('Чья это выписка').selectOption({ label: 'Наличные' });
  const day = new Date(Date.now() - 24 * 3600 * 1000);
  const date = `${String(day.getDate()).padStart(2, '0')}.${String(day.getMonth() + 1).padStart(2, '0')}.${day.getFullYear()}`;
  const csv = `Дата;Сумма;Описание\r\n${date} 09:00;-200,25;Рынок`;
  await importDialog.locator('input[type="file"]').setInputFiles({ name: 'cash.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(importDialog.getByText('cash.csv · Счёт: Наличные')).toBeVisible();
  await importDialog.getByRole('button', { name: 'Импортировать' }).click();
  await importDialog.getByRole('button', { name: 'Готово' }).click();
  await expect(page.getByText('Рынок').first()).toBeVisible();
  await expect(page.getByText(/· Наличные/).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(main.getByText(money('143 860,25')).first()).toBeVisible();

  // Удаление счёта убирает и его операции
  await nav.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('button', { name: 'Удалить счёт Наличные' }).click();
  await page.getByRole('dialog', { name: 'Удалить счёт «Наличные»?' }).getByRole('button', { name: 'Удалить счёт' }).click();
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(main.getByText(money('142 560')).first()).toBeVisible();
});

test('бюджеты по категориям и сверка счёта с банком', async ({ page }) => {
  await openAppWithDemo(page);
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  const main = page.getByRole('main');

  // На «Главной» — лимиты демо-данных
  await expect(main.getByRole('heading', { name: 'Бюджеты по категориям' })).toBeVisible();
  await expect(main.getByRole('progressbar', { name: 'Еда' })).toBeVisible();

  // Трата 500 ₽ в «Еду» (категория по умолчанию) и лимит меньше неё — лимит превышен
  await page.getByRole('button', { name: 'Добавить операцию' }).first().click();
  const txDialog = page.getByRole('dialog', { name: 'Новая операция' });
  await txDialog.getByLabel('Сумма').fill('500');
  await txDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await expect(main.getByText(money('142 060')).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('button', { name: 'Изменить лимит «Еда»' }).click();
  const budgetDialog = page.getByRole('dialog', { name: 'Изменить лимит' });
  await budgetDialog.getByLabel(/Лимит в месяц/).fill('100');
  await budgetDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByRole('status').getByText('Лимит сохранён')).toBeVisible();
  await expect(main.getByRole('progressbar', { name: 'Еда' })).toHaveAttribute('aria-valuetext', /Превышен на/);

  // Предупреждение под колокольчиком
  await page.getByRole('button', { name: 'Уведомления' }).first().click();
  const notifications = page.getByRole('dialog', { name: 'Уведомления' });
  await expect(notifications.getByText(/«Еда»: лимит превышен на/)).toBeVisible();
  await notifications.getByRole('button', { name: 'Закрыть' }).last().click();

  // Сверка: в банке на 10,50 ₽ больше — разницу учитываем в начальном остатке
  await page.getByRole('button', { name: 'Сверить счёт Основной счёт с банком' }).click();
  const reconcile = page.getByRole('dialog', { name: 'Сверка с банком: Основной счёт' });
  await reconcile.getByLabel(/Остаток в банке/).fill('142070,50');
  await expect(reconcile.getByText(/\+10,50\s₽/)).toBeVisible();
  await expect(reconcile.getByText(/В банке на 10,50\s₽ больше/)).toBeVisible();
  await reconcile.getByRole('button', { name: 'Учесть разницу в начальном остатке' }).click();
  await expect(page.getByRole('status').getByText(/Начальный остаток поправлен/)).toBeVisible();
  await expect(main.getByText(/Сверено на .*: совпадает/)).toBeVisible();

  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(main.getByText(money('142 070,50')).first()).toBeVisible();
});

test('пример выписки с лендинга: чистый счёт, импорт и отчёт', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Попробовать на примере выписки' }).first().click();

  // Первый визит: знакомство не показывается, сразу окно импорта с образцом
  const dialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await expect(dialog.getByText('К импорту: 16 из 16')).toBeVisible();
  await expect(dialog.getByRole('list', { name: 'Шаги импорта' }).getByRole('listitem').nth(1)).toHaveAttribute('aria-current', 'step');
  await dialog.getByRole('button', { name: 'Импортировать' }).click();
  await expect(dialog.getByText('Что нашли в выписке')).toBeVisible();
  await dialog.getByRole('button', { name: 'Открыть аналитику' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Аналитика' })).toBeVisible();

  // Счёт был пустым: на «Главной» только выписка (20 000 ₽ до неё не было — баланс без начального остатка)
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('142 055,60')).first()).toBeVisible();
  // Выписка загружена — приглашение загрузить её больше не показывается
  await expect(page.getByRole('heading', { name: 'Загрузите выписку из банка' })).toHaveCount(0);
});

test('настройки разбиты на разделы, профиль в шапке открывает «Профиль»', async ({ page }) => {
  await openAppWithDemo(page);
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.getByRole('tab', { name: 'Деньги' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Счета' })).toBeVisible();

  await page.getByRole('tab', { name: 'Приложение' }).click();
  await expect(page.getByRole('heading', { name: 'Параметры' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Счета' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Профиль', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Профиль' })).toHaveAttribute('aria-selected', 'true');
});
