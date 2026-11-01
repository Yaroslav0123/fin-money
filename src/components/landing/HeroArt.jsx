/*
 * Свои нарисованные герои для лендинга (SVG 100×100): ниндзя, юный волшебник и бегущая монетка.
 * Показываются в той же круглой рамке, что и Смешарики (Smesharik.jsx), поэтому рисунок заполняет весь квадрат.
 * Цвета заданы прямо в рисунке: персонажи одинаковые в светлой и тёмной теме.
 */

// Ниндзя: круглый, в тёмном костюме, красная повязка с развевающимися концами, сюрикен в руке
export function NinjaArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#ffd9a8" />
      {/* Концы повязки за спиной */}
      <path d="M74 36c8-2 14 2 20-2-2 7-10 9-18 8Z" fill="#e2453c" />
      <path d="M74 40c7 3 12 9 18 9-4 5-12 3-17-3Z" fill="#c8352d" />
      {/* Тело-голова */}
      <circle cx="50" cy="56" r="32" fill="#2f3450" />
      {/* Открытая полоса лица */}
      <rect x="24" y="40" width="52" height="18" rx="9" fill="#f6c89a" />
      {/* Повязка с монеткой */}
      <rect x="20" y="31" width="60" height="9" rx="4.5" fill="#e2453c" />
      <circle cx="50" cy="35.5" r="5.5" fill="#f6c343" stroke="#c99a1e" strokeWidth="1.5" />
      <rect x="49" y="32" width="2" height="7" rx="1" fill="#c99a1e" />
      {/* Хитрые глаза */}
      <ellipse cx="40" cy="49" rx="4" ry="4.5" fill="#fff" />
      <ellipse cx="60" cy="49" rx="4" ry="4.5" fill="#fff" />
      <circle cx="41" cy="50" r="2.3" fill="#1d1d2b" />
      <circle cx="61" cy="50" r="2.3" fill="#1d1d2b" />
      <path d="M34 43l11 2M66 43l-11 2" stroke="#1d1d2b" strokeWidth="2" strokeLinecap="round" />
      {/* Рука со сюрикеном */}
      <circle cx="76" cy="72" r="6" fill="#2f3450" />
      <path d="M80 62l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#b9c0cc" stroke="#7d8696" strokeWidth="1" />
      <circle cx="80" cy="72" r="1.6" fill="#7d8696" />
    </svg>
  );
}

// Юный волшебник: высокий фиолетовый колпак со звёздами, зелёная мантия, палочка с искрами
export function WizardArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#d8f0e0" />
      {/* Мантия */}
      <path d="M22 100c2-20 13-30 28-30s26 10 28 30Z" fill="#2f8f63" />
      <path d="M44 72l6 10 6-10" fill="#f6c343" />
      {/* Лицо */}
      <circle cx="50" cy="60" r="18" fill="#f6c89a" />
      <circle cx="42" cy="58" r="2.4" fill="#1d1d2b" />
      <circle cx="58" cy="58" r="2.4" fill="#1d1d2b" />
      <circle cx="38" cy="65" r="3" fill="#f39c9c" opacity="0.7" />
      <circle cx="62" cy="65" r="3" fill="#f39c9c" opacity="0.7" />
      <path d="M44 67c3 3 9 3 12 0" stroke="#1d1d2b" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Колпак с загнутым кончиком */}
      <path d="M28 46C38 36 44 20 52 6c3 6 2 12 8 14-2 8 6 18 12 26Z" fill="#6b4bc4" />
      <ellipse cx="50" cy="46" rx="26" ry="5" fill="#553a9e" />
      <path d="M44 28l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.4Z" fill="#f6c343" />
      <circle cx="56" cy="36" r="1.8" fill="#f6c343" />
      <circle cx="51" cy="16" r="1.4" fill="#f6c343" />
      {/* Палочка с искрами */}
      <path d="M70 92L84 64" stroke="#7a5230" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M86 52l2 5 5 .6-3.8 3.4 1 5-4.2-2.6-4.4 2.4 1.2-4.9-3.6-3.6 5-.4Z" fill="#f6c343" />
      <circle cx="94" cy="50" r="1.3" fill="#f6c343" />
      <circle cx="80" cy="50" r="1" fill="#f6c343" />
    </svg>
  );
}

// Бегущая монетка: золотая, в красных кроссовках, позади — полоски скорости и облачка пыли
export function RunnerArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#e3f1ff" />
      {/* Полоски скорости */}
      <path d="M6 38h20M2 50h22M8 62h16" stroke="#9cc3e8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="22" cy="84" r="5" fill="#cfe2f5" />
      <circle cx="13" cy="86" r="3.5" fill="#cfe2f5" />
      {/* Ноги и кроссовки */}
      <path d="M50 70l-10 12M62 70l10 9" stroke="#c99a1e" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 84c0-4 4-6 10-5l4 2c2 1 2 5-1 5H32c-1 0-2-1-2-2Z" fill="#e2453c" />
      <path d="M70 82c1-4 5-5 10-3l3 2c2 2 1 5-2 5H72c-1 0-2-2-2-4Z" fill="#e2453c" />
      <path d="M32 85h12M72 84h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      {/* Руки */}
      <path d="M34 50l-10-6M78 46l9-8" stroke="#c99a1e" strokeWidth="3.5" strokeLinecap="round" />
      {/* Монетка */}
      <circle cx="56" cy="46" r="25" fill="#f6c343" stroke="#c99a1e" strokeWidth="3" />
      <circle cx="56" cy="46" r="18" fill="none" stroke="#e0ad2c" strokeWidth="2" />
      {/* Лицо: азартный взгляд вперёд и улыбка */}
      <ellipse cx="57" cy="41" rx="3.6" ry="4.4" fill="#fff" />
      <ellipse cx="68" cy="41" rx="3.6" ry="4.4" fill="#fff" />
      <circle cx="59" cy="42" r="2.2" fill="#1d1d2b" />
      <circle cx="70" cy="42" r="2.2" fill="#1d1d2b" />
      <path d="M57 51c4 5 11 5 14-1" stroke="#1d1d2b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M53 35l7-2M65 33l7 1" stroke="#1d1d2b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
