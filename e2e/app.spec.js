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

  await page.getByRole('button', { name: 'Импорт CSV' }).click();
  const dialog = page.getByRole('dialog', { name: 'Импорт выписки' });
  await dialog.locator('input[type="file"]').setInputFiles(await download.path());
  await expect(dialog.getByRole('alert')).toHaveText('В файле нет операций, которые можно добавить.');
});
