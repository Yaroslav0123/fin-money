/*
 * Деньги хранятся целым числом копеек: 1 234,56 ₽ → 123456.
 * Так суммы складываются точно, без ошибок дробных чисел (0,1 + 0,2 ≠ 0,3),
 * и баланс после импорта выписки совпадает с банковским до копейки.
 * Рубли — только на входе (поля ввода, файлы выписок, тексты) и при показе.
 */
export const KOPECKS_IN_RUBLE = 100;

// Рубли (можно с копейками) → копейки: rub(1234.56) → 123456
export const rub = (rubles) => Math.round(rubles * KOPECKS_IN_RUBLE);

// Копейки → рубли: toRubles(123456) → 1234.56
export const toRubles = (kopecks) => kopecks / KOPECKS_IN_RUBLE;

// Есть ли в сумме копейки
export const hasKopecks = (kopecks) => kopecks % KOPECKS_IN_RUBLE !== 0;
