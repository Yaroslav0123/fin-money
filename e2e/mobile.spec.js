import { expect, test } from '@playwright/test';
import { money, openAppWithDemo } from './helpers.js';

// Узкий экран телефона: нижняя панель вместо бокового меню и без горизонтальной прокрутки

test('на телефоне работает нижняя панель и нет горизонтальной прокрутки', async ({ page }) => {
  await openAppWithDemo(page);
  await expect(page.getByRole('main').getByText(money('142 560')).first()).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Разделы приложения' });
  for (const label of ['Аналитика', 'Цели', 'Накопления', 'Главная']) {
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
