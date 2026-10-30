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
  await dialog.getByRole('button', { name: 'Импортировать' }).click();
  await expect(page.getByRole('status').getByText('Импортировано операций: 16')).toBeVisible();

  // 142 560 + поступления 176 490 − списания 34 435 (копейки округлены по каждой операции)
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('284 615')).first()).toBeVisible();

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

  // 142 560 − 350 − 5 000
  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('137 210')).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('button', { name: 'Отменить импорт bank.csv' }).click();
  await page.getByRole('dialog', { name: 'Отменить импорт «bank.csv»?' }).getByRole('button', { name: 'Удалить операции' }).click();
  await expect(page.getByText('Выписок пока не загружали.')).toBeVisible();

  await nav.getByRole('button', { name: 'Главная' }).click();
  await expect(page.getByRole('main').getByText(money('142 560')).first()).toBeVisible();
});
