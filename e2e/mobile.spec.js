import { expect, test } from '@playwright/test';
import { money, openAppWithDemo } from './helpers.js';

// Узкий экран телефона: нижняя панель вместо бокового меню и без горизонтальной прокрутки

test('на телефоне работает нижняя панель и нет горизонтальной прокрутки', async ({ page }) => {
  await openAppWithDemo(page);
  await expect(page.getByRole('main').getByText(money('142 560')).first()).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  for (const label of ['Аналитика', 'Цели', 'Операции', 'Главная']) {
    await nav.getByRole('button', { name: label }).click();
    await expect(nav.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `горизонтальная прокрутка на экране «${label}»`).toBeLessThanOrEqual(0);
  }
});

test('на телефоне кнопка «+» открывает новую операцию', async ({ page }) => {
  await openAppWithDemo(page);
  await page.getByRole('navigation', { name: 'Разделы приложения' }).getByRole('button', { name: 'Добавить' }).click();
  await expect(page.getByRole('dialog', { name: 'Новая операция' })).toBeVisible();
});

test('на телефоне «Накопления» и «Настройки» — в меню профиля, поиск операций прилипает к шапке', async ({ page }) => {
  await openAppWithDemo(page);
  await page.getByRole('button', { name: 'Меню профиля' }).click();
  await page.getByRole('button', { name: 'Накопления' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Накопительный счёт' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Разделы приложения' }).getByRole('button', { name: 'Операции' }).click();
  // Фильтры свёрнуты под кнопку
  await expect(page.getByRole('combobox', { name: 'Период' })).toBeHidden();
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('combobox', { name: 'Период' })).toBeVisible();

  // После прокрутки поиск остаётся на экране
  await page.mouse.wheel(0, 3000);
  await expect(page.getByRole('searchbox', { name: 'Поиск по названию или категории' })).toBeInViewport();
});
