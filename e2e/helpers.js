import { expect } from '@playwright/test';

// Сумма в рублях как на экране: «142 560 ₽» (между разрядами неразрывный пробел)
export const money = (text) => new RegExp(`${text.replace(/ /g, '\\s')}\\s₽`);

// Лендинг → «Мои финансы» → знакомство пропускаем, выбирая демо-данные
export async function openAppWithDemo(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Мои финансы' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Кнопка закрытия знакомства тоже подписана «Посмотреть на демо-данных»
  await dialog.getByRole('button', { name: 'Посмотреть на демо-данных' }).first().click();
  await expect(dialog).toBeHidden();
}
