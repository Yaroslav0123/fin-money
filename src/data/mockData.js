// Моковые данные приложения. Все тексты и числа живут здесь,
// компоненты только отображают их.
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  Car,
  Clapperboard,
  Ellipsis,
  EyeOff,
  Fingerprint,
  Gift,
  GraduationCap,
  House,
  KeyRound,
  LayoutGrid,
  Mail,
  Laptop,
  Percent,
  PiggyBank,
  Plane,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  TrendingDown,
  TriangleAlert,
  Utensils,
  Wallet,
} from 'lucide-react';

// Список экранов для демо-переключателя
export const SCREENS = [
  { id: 'onboarding', label: 'Приветствие' },
  { id: 'dashboard', label: 'Главная' },
  { id: 'savings', label: 'Накопления' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'goals', label: 'Цели' },
  { id: 'settings', label: 'Настройки' },
];

export const APP_NAME = 'Fin Money';

// ───────────── Каркас веб-приложения ─────────────

// Пункты бокового меню. screen — id экрана; null — раздел ещё не готов.
export const APP_NAV = [
  { id: 'dashboard', label: 'Главная', icon: LayoutGrid, screen: 'dashboard' },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3, screen: 'analytics' },
  { id: 'savings', label: 'Накопления', icon: PiggyBank, screen: 'savings' },
  { id: 'goals', label: 'Цели', icon: Target, screen: 'goals' },
  { id: 'settings', label: 'Настройки', icon: Settings, screen: 'settings' },
];

// Нижняя панель на узких экранах (как в мобильном макете): по центру кнопка «+»
export const BOTTOM_NAV = [
  { id: 'dashboard', label: 'Главная', icon: LayoutGrid, screen: 'dashboard' },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3, screen: 'analytics' },
  { id: 'add', label: 'Добавить', isAction: true },
  { id: 'goals', label: 'Цели', icon: Target, screen: 'goals' },
  { id: 'savings', label: 'Накопления', icon: PiggyBank, screen: 'savings' },
];

export const APP_SHELL = {
  searchPlaceholder: 'Поиск операций',
  addAction: 'Добавить операцию',
  notificationsLabel: 'Уведомления',
  profileLabel: 'Профиль',
  backToSite: 'На сайт',
  promo: {
    title: 'Накопительный счёт',
    text: 'До 12% годовых на остаток. Пополнение в любое время.',
    action: 'Открыть',
  },
};

// Заголовки экранов в верхней панели
export const SCREEN_META = {
  dashboard: { title: 'Главная', subtitle: 'Добрый день! Вот ваши финансы за май' },
  savings: { title: 'Накопительный счёт', subtitle: 'Копите на важные цели с выгодной ставкой' },
  analytics: { title: 'Аналитика', subtitle: 'Расходы и доходы за выбранный период' },
  goals: { title: 'Цели', subtitle: 'Копите на мечты шаг за шагом' },
  settings: { title: 'Настройки', subtitle: 'Профиль, уведомления и безопасность' },
};

// ───────────── Финансовые данные (общие для всех экранов) ─────────────

// Сводка по счетам
export const SUMMARY = {
  balance: {
    label: 'Общий баланс',
    amount: 142560,
    trend: { amount: 12340, suffix: 'за месяц' },
    icon: Wallet,
    accent: 'green',
  },
  income: { label: 'Доходы', amount: 86400, trend: { percent: 18 }, icon: ArrowUp, accent: 'green' },
  expenses: { label: 'Расходы', amount: 63200, trend: { percent: 6 }, icon: ArrowDown, accent: 'pink' },
};

// Категории расходов (сумма = SUMMARY.expenses.amount, доли = 100%)
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Еда', amount: 20200, share: 32, accent: 'green', icon: Utensils },
  { id: 'transport', name: 'Транспорт', amount: 11400, share: 18, accent: 'blue', icon: Car },
  { id: 'fun', name: 'Развлечения', amount: 9500, share: 15, accent: 'purple', icon: Star },
  { id: 'housing', name: 'Жильё', amount: 7600, share: 12, accent: 'orange', icon: House },
  { id: 'other', name: 'Другое', amount: 14500, share: 23, accent: 'gray', icon: Ellipsis },
];

// Накопительный счёт
export const SAVINGS = {
  title: 'Накопительный счёт',
  description: 'Копите на важные цели с выгодной ставкой. Пополнение в любое время.',
  features: [
    { id: 'rate', icon: Percent, title: 'До 12%', caption: 'годовых' },
    { id: 'amount', icon: Wallet, title: 'Любая', caption: 'сумма' },
    { id: 'fee', icon: ShieldCheck, title: 'Без', caption: 'комиссий' },
  ],
  balanceLabel: 'Текущий баланс',
  balance: 52000,
  trend: { amount: 4200, suffix: 'за месяц' },
  depositAction: 'Пополнить',
  withdrawAction: 'Снять',
};

// История баланса накопительного счёта по периодам
export const SAVINGS_PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
];

export const SAVINGS_HISTORY = {
  week: [
    { label: 'Пн', value: 50900 },
    { label: 'Вт', value: 51050 },
    { label: 'Ср', value: 51020 },
    { label: 'Чт', value: 51400 },
    { label: 'Пт', value: 51380 },
    { label: 'Сб', value: 51760 },
    { label: 'Вс', value: 52000 },
  ],
  month: [
    { label: '1 мая', value: 47800 },
    { label: '3 мая', value: 48150 },
    { label: '5 мая', value: 47950 },
    { label: '7 мая', value: 48400 },
    { label: '9 мая', value: 48300 },
    { label: '11 мая', value: 48900 },
    { label: '12 мая', value: 49300 },
    { label: '14 мая', value: 49100 },
    { label: '16 мая', value: 49700 },
    { label: '18 мая', value: 49550 },
    { label: '20 мая', value: 50200 },
    { label: '22 мая', value: 50050 },
    { label: '24 мая', value: 50700 },
    { label: '26 мая', value: 50900 },
    { label: '28 мая', value: 51500 },
    { label: '31 мая', value: 52000 },
  ],
  year: [
    { label: 'Июн', value: 8000 },
    { label: 'Июл', value: 11500 },
    { label: 'Авг', value: 14200 },
    { label: 'Сен', value: 18900 },
    { label: 'Окт', value: 21300 },
    { label: 'Ноя', value: 25800 },
    { label: 'Дек', value: 31000 },
    { label: 'Янв', value: 33400 },
    { label: 'Фев', value: 37900 },
    { label: 'Мар', value: 42100 },
    { label: 'Апр', value: 47800 },
    { label: 'Май', value: 52000 },
  ],
};

// Финансовые цели. monthsLeft — сколько месяцев осталось до срока.
export const GOALS = [
  { id: 'trip', name: 'Путешествие', icon: Plane, accent: 'green', deadline: 'до 12 мая 2027', monthsLeft: 12, saved: 43500, target: 100000 },
  { id: 'laptop', name: 'Новый ноутбук', icon: Laptop, accent: 'purple', deadline: 'до 1 сентября 2026', monthsLeft: 4, saved: 54000, target: 120000 },
  { id: 'car', name: 'Автомобиль', icon: Car, accent: 'blue', deadline: 'до 10 августа 2028', monthsLeft: 27, saved: 180000, target: 900000 },
  { id: 'cushion', name: 'Подушка безопасности', icon: ShieldCheck, accent: 'orange', deadline: 'достигнута в марте 2026', monthsLeft: 0, saved: 150000, target: 150000 },
];

// Последние операции по основному счёту
export const TRANSACTIONS = [
  { id: 't1', title: 'Супермаркет', category: 'Еда', date: '31 мая, 18:40', amount: -2340, icon: ShoppingCart, accent: 'green' },
  { id: 't2', title: 'Такси', category: 'Транспорт', date: '31 мая, 09:15', amount: -460, icon: Car, accent: 'blue' },
  { id: 't3', title: 'Зарплата', category: 'Доход', date: '30 мая, 10:00', amount: 64800, icon: Briefcase, accent: 'brand' },
  { id: 't4', title: 'Кинотеатр', category: 'Развлечения', date: '29 мая, 20:30', amount: -1200, icon: Clapperboard, accent: 'purple' },
  { id: 't5', title: 'Коммунальные услуги', category: 'Жильё', date: '28 мая, 12:05', amount: -5400, icon: House, accent: 'orange' },
  { id: 't6', title: 'Пополнение накоплений', category: 'Накопления', date: '12 мая, 14:20', amount: -10000, icon: PiggyBank, accent: 'brand' },
];

// Переводы между основным и накопительным счётом в списке операций «Главной».
// Это не доход и не расход: меняется только общий баланс.
export const SAVINGS_TRANSFER = {
  category: 'Накопления',
  icon: PiggyBank,
  accent: 'brand',
  titles: { deposit: 'Пополнение накоплений', withdraw: 'Снятие с накоплений' },
};

// ───────────── Экран «Накопления» ─────────────

// Типы операций по накопительному счёту: иконка, цвет и подпись
export const SAVINGS_TX_TYPES = {
  deposit: { label: 'Пополнения', title: 'Пополнение', icon: ArrowUpRight, accent: 'green' },
  interest: { label: 'Проценты', title: 'Проценты', icon: Percent, accent: 'brand' },
  withdraw: { label: 'Снятия', title: 'Снятие', icon: ArrowDownLeft, accent: 'pink' },
};

// История операций по накопительному счёту
export const SAVINGS_TRANSACTIONS = [
  { id: 's1', type: 'deposit', date: '12 мая 2026', amount: 10000 },
  { id: 's2', type: 'interest', date: '10 мая 2026', amount: 420 },
  { id: 's3', type: 'withdraw', date: '28 апреля 2026', amount: -3000 },
  { id: 's4', type: 'deposit', date: '15 апреля 2026', amount: 5000 },
  { id: 's5', type: 'interest', date: '10 апреля 2026', amount: 380 },
  { id: 's6', type: 'deposit', date: '1 апреля 2026', amount: 15000 },
];

export const SAVINGS_PAGE = {
  // Годовая ставка в процентах (для калькулятора)
  annualRate: 12,
  interest: {
    title: 'Доход по процентам',
    monthLabel: 'Начислено в мае',
    monthAmount: 420,
    totalLabel: 'За всё время',
    totalAmount: 2860,
    nextLabel: 'Следующее начисление',
    nextDate: '10 июня',
    rateLabel: 'Ставка',
    rateValue: 'до 12% годовых',
  },
  chart: { title: 'Динамика баланса' },
  calculator: {
    title: 'Калькулятор доходности',
    monthlyLabel: 'Пополнение в месяц',
    termLabel: 'Срок',
    monthsSuffix: 'мес.',
    resultPrefix: 'Через',
    resultSuffix: 'на счёте будет',
    interestLabel: 'Из них проценты',
    note: 'Расчёт с ежемесячной капитализацией, ставка 12% годовых.',
    defaults: { monthly: 5000, term: 12 },
    ranges: {
      monthly: { min: 0, max: 50000, step: 1000 },
      term: { min: 1, max: 36, step: 1 },
    },
  },
  history: { title: 'История', allFilter: 'Все', empty: 'Операций этого типа пока нет' },
  goals: { title: 'Копите на цели', allLink: 'Все цели' },
  // Диалог пополнения / снятия
  dialog: {
    deposit: { title: 'Пополнить счёт', confirm: 'Пополнить' },
    withdraw: { title: 'Снять со счёта', confirm: 'Снять' },
    amountLabel: 'Сумма',
    amountPlaceholder: '0',
    quickAmounts: [1000, 5000, 10000],
    available: 'Доступно',
    cancel: 'Отмена',
    errorTooMuch: 'Сумма больше баланса счёта',
    newTxDate: 'Сегодня',
  },
};

// ───────────── Экран «Аналитика» ─────────────

// Расходы по периодам. Сумма столбцов bars = total.
// Доли категорий для любого периода берутся из EXPENSE_CATEGORIES.
export const ANALYTICS_PERIODS = [
  {
    id: 'day',
    chartTitle: 'Расходы по часам',
    label: 'День',
    rangeLabel: '31 мая 2026',
    days: 1,
    total: 2800,
    trend: { percent: -12 },
    bars: [
      { label: '00:00', value: 20 },
      { label: '02:00', value: 20 },
      { label: '04:00', value: 20 },
      { label: '06:00', value: 190 },
      { label: '08:00', value: 190 },
      { label: '10:00', value: 410 },
      { label: '12:00', value: 290 },
      { label: '14:00', value: 390 },
      { label: '16:00', value: 440 },
      { label: '18:00', value: 370 },
      { label: '20:00', value: 370 },
      { label: '22:00', value: 90 },
    ],
  },
  {
    id: 'week',
    chartTitle: 'Расходы по дням',
    label: 'Неделя',
    rangeLabel: '25–31 мая 2026',
    days: 7,
    total: 14800,
    trend: { percent: 4 },
    bars: [
      { label: 'Пн', value: 1500 },
      { label: 'Вт', value: 1270 },
      { label: 'Ср', value: 2950 },
      { label: 'Чт', value: 1840 },
      { label: 'Пт', value: 1400 },
      { label: 'Сб', value: 3280 },
      { label: 'Вс', value: 2560 },
    ],
  },
  {
    id: 'month',
    chartTitle: 'Расходы по дням',
    label: 'Месяц',
    rangeLabel: '1–31 мая 2026',
    days: 31,
    total: 63200,
    trend: { percent: -6 },
    bars: [
      1890, 2030, 1130, 1390, 1790, 2880, 1590, 2660, 2080, 1730, 1470, 2470, 3330, 1580, 1900, 1370, 2250, 1220,
      2030, 2820, 1880, 1000, 2780, 2850, 1140, 1790, 4230, 1920, 1740, 2010, 2250,
    ].map((value, index) => ({ label: `${index + 1} мая`, value })),
  },
  {
    id: 'year',
    chartTitle: 'Расходы по месяцам',
    label: 'Год',
    rangeLabel: 'июнь 2025 — май 2026',
    days: 365,
    total: 789100,
    trend: { percent: -4 },
    bars: [
      { label: 'Июн', value: 61800 },
      { label: 'Июл', value: 74300 },
      { label: 'Авг', value: 58900 },
      { label: 'Сен', value: 66200 },
      { label: 'Окт', value: 70400 },
      { label: 'Ноя', value: 59700 },
      { label: 'Дек', value: 64800 },
      { label: 'Янв', value: 71200 },
      { label: 'Фев', value: 62500 },
      { label: 'Мар', value: 68900 },
      { label: 'Апр', value: 67200 },
      { label: 'Май', value: 63200 },
    ],
  },
];

// Доходы и расходы за последние полгода
export const INCOME_VS_EXPENSES = [
  { label: 'Дек', income: 84000, expenses: 64800 },
  { label: 'Янв', income: 81500, expenses: 71200 },
  { label: 'Фев', income: 82000, expenses: 62500 },
  { label: 'Мар', income: 84200, expenses: 68900 },
  { label: 'Апр', income: 80100, expenses: 67200 },
  { label: 'Май', income: 86400, expenses: 63200 },
];

// Подсказки-«инсайты» по тратам
export const INSIGHTS = [
  { id: 'i1', icon: TrendingDown, accent: 'brand', text: 'Расходы в мае на 4 000 ₽ ниже, чем в апреле. Так держать!' },
  { id: 'i2', icon: Utensils, accent: 'green', text: 'Еда — самая крупная категория: 32% всех трат.' },
  { id: 'i3', icon: CalendarDays, accent: 'purple', text: 'В выходные вы тратите примерно в 1,5 раза больше, чем в будни.' },
  { id: 'i4', icon: Target, accent: 'blue', text: 'До цели «Новый ноутбук» осталось 66 000 ₽ — около 4 месяцев.' },
];

export const ANALYTICS_PAGE = {
  defaultPeriod: 'month',
  calendarLabel: 'Выбрать период',
  kpi: {
    expenses: 'Расходы',
    perDay: 'В среднем за день',
    topCategory: 'Крупнейшая категория',
    vsPrevious: 'к прошлому периоду',
    shareOfTotal: 'от всех расходов',
  },
  categories: { title: 'Категории', allLink: 'Все' },
  comparison: { title: 'Доходы и расходы', subtitle: 'За последние 6 месяцев', income: 'Доходы', expenses: 'Расходы' },
  insights: { title: 'Подсказки' },
};

// ───────────── Экран «Цели» ─────────────

// Иконки, из которых можно выбрать при создании новой цели
export const GOAL_ICON_OPTIONS = [
  { id: 'plane', icon: Plane, accent: 'green' },
  { id: 'laptop', icon: Laptop, accent: 'purple' },
  { id: 'car', icon: Car, accent: 'blue' },
  { id: 'house', icon: House, accent: 'orange' },
  { id: 'gift', icon: Gift, accent: 'pink' },
  { id: 'study', icon: GraduationCap, accent: 'brand' },
];

// Варианты срока для новой цели (в месяцах)
export const GOAL_TERM_OPTIONS = [3, 6, 12, 24];

export const GOALS_PAGE = {
  kpi: {
    saved: 'Накоплено на цели',
    left: 'Осталось накопить',
    done: 'Целей достигнуто',
    doneOf: 'из',
    savedHint: 'на всех целях',
    leftHint: 'до всех активных целей',
    doneHint: 'Так держать!',
  },
  filters: [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'В процессе' },
    { id: 'done', label: 'Достигнуты' },
  ],
  newGoal: 'Новая цель',
  newGoalHint: 'Поставьте цель — мы поможем рассчитать ежемесячный взнос',
  tile: {
    of: 'из',
    left: 'Осталось',
    perMonth: 'в месяц',
    deposit: 'Пополнить',
    done: 'Цель достигнута',
  },
  empty: 'Здесь пока нет целей',
  distribution: { title: 'Распределение накоплений', caption: 'накоплено' },
  // Диалог пополнения цели (переиспользует AmountDialog)
  depositDialog: {
    titlePrefix: 'Пополнить цель',
    confirm: 'Пополнить',
    amountLabel: 'Сумма',
    amountPlaceholder: '0',
    quickAmounts: [1000, 5000, 10000],
    available: 'Осталось накопить',
    cancel: 'Отмена',
    errorTooMuch: '',
  },
  // Диалог создания цели
  createDialog: {
    title: 'Новая цель',
    nameLabel: 'Название',
    namePlaceholder: 'Например, «Велосипед»',
    targetLabel: 'Сколько нужно накопить',
    termLabel: 'Срок',
    termSuffix: 'мес.',
    iconLabel: 'Иконка',
    perMonthHint: 'Ежемесячный взнос составит',
    deadlinePrefix: 'через',
    confirm: 'Создать цель',
    cancel: 'Отмена',
  },
};

// ───────────── Экран «Настройки» ─────────────

export const SETTINGS_PAGE = {
  saved: 'Изменения сохранены',
  profile: {
    title: 'Профиль',
    description: 'Личные данные для входа и уведомлений',
    // Вымышленные данные для прототипа
    defaults: { name: 'Алексей Смирнов', email: 'alexey@example.com', phone: '+7 900 000-00-00' },
    fields: [
      { id: 'name', label: 'Имя', type: 'text' },
      { id: 'email', label: 'Email', type: 'email' },
      { id: 'phone', label: 'Телефон', type: 'tel' },
    ],
    plan: 'Fin Money Free',
    save: 'Сохранить',
  },
  budget: {
    title: 'Месячный бюджет',
    description: 'Предупредим, когда расходы подойдут к лимиту',
    spentLabel: 'Потрачено в мае',
    of: 'из',
    left: 'Осталось',
    over: 'Превышение',
    warning: 'Вы почти исчерпали бюджет',
    defaultLimit: 80000,
    range: { min: 20000, max: 200000, step: 5000 },
    // Порог (в процентах), после которого бюджет подсвечивается красным
    warnAt: 90,
  },
  notifications: {
    title: 'Уведомления',
    items: [
      { id: 'push', icon: Bell, label: 'Push-уведомления', hint: 'Об операциях и начислениях', defaultOn: true },
      { id: 'weekly', icon: Mail, label: 'Еженедельный отчёт', hint: 'Сводка трат на email', defaultOn: true },
      { id: 'goals', icon: Target, label: 'Напоминания о целях', hint: 'Когда пора пополнить цель', defaultOn: true },
      { id: 'large', icon: TriangleAlert, label: 'Крупные траты', hint: 'Операции дороже 5 000 ₽', defaultOn: false },
    ],
  },
  preferences: {
    title: 'Параметры',
    currency: { label: 'Валюта', options: [{ id: 'rub', label: '₽' }, { id: 'usd', label: '$' }, { id: 'eur', label: '€' }], default: 'rub' },
    weekStart: { label: 'Начало недели', options: [{ id: 'mon', label: 'Пн' }, { id: 'sun', label: 'Вс' }], default: 'mon' },
    language: {
      label: 'Язык',
      options: [{ id: 'ru', label: 'Русский' }, { id: 'en', label: 'English' }],
      default: 'ru',
    },
  },
  security: {
    title: 'Безопасность',
    toggles: [
      { id: 'biometry', icon: Fingerprint, label: 'Вход по биометрии', hint: 'Face ID или отпечаток пальца', defaultOn: true },
      { id: 'hideBalance', icon: EyeOff, label: 'Скрывать баланс', hint: 'Суммы скрыты при открытии', defaultOn: false },
    ],
    links: [
      { id: 'password', icon: KeyRound, label: 'Сменить пароль' },
      { id: 'devices', icon: Smartphone, label: 'Активные устройства', badge: '2' },
    ],
    logout: 'Выйти из аккаунта',
  },
};

// ───────────── Добавление операции (кнопки «+» и «Добавить операцию») ─────────────

// Категории доходов (для расходов используются EXPENSE_CATEGORIES)
export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Зарплата', accent: 'brand', icon: Briefcase },
  { id: 'freelance', name: 'Подработка', accent: 'blue', icon: Laptop },
  { id: 'cashback', name: 'Кэшбэк', accent: 'green', icon: Percent },
  { id: 'gift', name: 'Подарок', accent: 'pink', icon: Gift },
];

export const ADD_TRANSACTION = {
  title: 'Новая операция',
  types: [
    { id: 'expense', label: 'Расход' },
    { id: 'income', label: 'Доход' },
  ],
  amountLabel: 'Сумма',
  categoryLabel: 'Категория',
  commentLabel: 'Комментарий',
  commentPlaceholder: 'Необязательно, например «Кофе с коллегами»',
  quickAmounts: [500, 1000, 5000],
  confirm: 'Добавить',
  cancel: 'Отмена',
  success: 'Операция добавлена',
  incomeCategoryLabel: 'Доход',
  todayPrefix: 'Сегодня',
};

// ───────────── Экран «Главная» ─────────────

export const DASHBOARD = {
  hideBalanceLabel: 'Скрыть баланс',
  showBalanceLabel: 'Показать баланс',
  hiddenAmount: '••• ••• ₽',
  actions: { deposit: 'Пополнить', transfer: 'Перевести' },
  goal: { title: 'Финансовая цель', goalId: 'laptop', allLink: 'Все цели', progressOf: 'из' },
  savingsCard: { title: 'Накопительный счёт', caption: 'До 12% годовых' },
  structure: { title: 'Структура расходов', caption: 'расходы', allLink: 'Все' },
  transactions: { title: 'Последние операции', allLink: 'Все', limit: 6 },
};

// ───────────── Веб-лендинг (экран «Приветствие») ─────────────

export const LANDING = {
  nav: [
    { id: 'home', label: 'Главная', href: '#top' },
    { id: 'analytics', label: 'Аналитика', href: '#overview' },
    { id: 'goals', label: 'Цели', href: '#goals' },
    { id: 'budget', label: 'Бюджет', href: '#categories' },
    { id: 'about', label: 'О приложении', href: '#about' },
  ],
  headerAction: 'Начать',
  hero: {
    badge: 'Ваши финансы — под контролем',
    titleLines: ['Управляй деньгами.', 'Достигай целей.'],
    textLines: ['Просто. Удобно. Эффективно.', 'Ваши финансы — под контролем.'],
    action: 'Начать',
  },
  overview: {
    eyebrow: 'Обзор',
    title: 'Общая картина ваших финансов',
    description: 'Следите за доходами и расходами, анализируйте структуру трат и управляйте накоплениями.',
    donutTitle: 'Структура расходов',
    donutCaption: 'расходы',
    allLink: 'Все',
  },
  categories: {
    eyebrow: 'Категории',
    title: 'Ваши расходы по категориям',
    description: 'Посмотрите, на что уходят деньги, и найдите точки для экономии.',
    allLink: 'Все',
  },
  goals: {
    eyebrow: 'Цели',
    title: 'Ваши цели и планы',
    description: 'Ставьте цели и двигайтесь к ним вместе с Fin Money.',
    allLink: 'Все цели',
    progressOf: 'из',
  },
  cta: {
    text: 'Начните управлять своими финансами уже сегодня и достигайте своих целей.',
    action: 'Начать',
  },
  footer: {
    copyright: '© 2026 Fin Money. Все права защищены.',
    links: [
      { id: 'privacy', label: 'Политика конфиденциальности', href: '#' },
      { id: 'terms', label: 'Условия использования', href: '#' },
    ],
  },
  // Пункты бокового меню в превью приложения на ноутбуке
  previewSidebar: [
    { id: 'home', label: 'Главная', icon: LayoutGrid },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'goals', label: 'Цели', icon: Target },
    { id: 'budget', label: 'Бюджет', icon: PiggyBank },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ],
};
