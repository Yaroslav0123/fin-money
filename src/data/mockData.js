// Моковые данные приложения. Все тексты и числа живут здесь,
// компоненты только отображают их. Денежные суммы — в копейках: rub(5000) — это 5 000 ₽.
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  Download,
  Database,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Ellipsis,
  EyeOff,
  FileUp,
  Fingerprint,
  Gift,
  GraduationCap,
  Heart,
  House,
  LayoutGrid,
  Mail,
  Laptop,
  PawPrint,
  Percent,
  PiggyBank,
  Pill,
  Plane,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Undo2,
  User,
  Utensils,
  Wallet,
} from 'lucide-react';
import { rub } from '../utils/money.js';

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
  navLabel: 'Разделы приложения',
  skipLink: 'Перейти к содержимому',
  searchPlaceholder: 'Поиск операций',
  addAction: 'Добавить операцию',
  // Загрузка выписки — главный сценарий, поэтому кнопка есть на каждом экране
  importAction: 'Загрузить выписку',
  notificationsLabel: 'Уведомления',
  profileLabel: 'Профиль',
  backToSite: 'На сайт',
  promo: {
    title: 'Накопительный счёт',
    text: 'До 12% годовых на остаток. Пополнение в любое время.',
    action: 'Открыть',
  },
  // Панель уведомлений (колокольчик): события считаются из данных
  notifications: {
    title: 'Уведомления',
    empty: 'Новых уведомлений нет',
    budget: 'Потрачено {percent}% месячного бюджета',
    categoryWarning: '«{name}»: потрачено {percent}% лимита, осталось {left}',
    categoryOver: '«{name}»: лимит превышен на {over}',
    goal: 'До срока цели «{name}» осталось {days} дн.',
    goalToday: 'Сегодня срок цели «{name}»',
    large: 'Крупная трата: {title} — {amount}',
    // Порог «крупной траты»
    largeAmount: rub(5000),
    close: 'Закрыть',
  },
};

// Заголовки экранов в верхней панели.
// Подзаголовок «Главной» собирается из приветствия и текущего месяца (см. DASHBOARD.subtitle).
export const SCREEN_META = {
  dashboard: { title: 'Главная' },
  savings: { title: 'Накопительный счёт', subtitle: 'Копите на важные цели с выгодной ставкой' },
  analytics: { title: 'Аналитика', subtitle: 'Расходы и доходы за выбранный период' },
  goals: { title: 'Цели', subtitle: 'Копите на мечты шаг за шагом' },
  settings: { title: 'Настройки', subtitle: 'Деньги, данные, профиль и параметры' },
  transactions: { title: 'Операции', subtitle: 'Вся история основного счёта' },
};

// Знакомство с приложением при первом входе
export const ONBOARDING = {
  steps: [
    { id: 'welcome', icon: Wallet, title: 'Добро пожаловать в Fin Money', text: 'Учебный проект: деньги здесь виртуальные, а данные хранятся только в вашем браузере.' },
    { id: 'track', icon: BarChart3, title: 'Учитывайте доходы и расходы', text: 'Добавляйте операции кнопкой «+», а графики и подсказки посчитаются сами.' },
    { id: 'goals', icon: Target, title: 'Копите на цели', text: 'Ставьте цели и откладывайте на накопительный счёт — прогресс видно сразу.' },
  ],
  next: 'Далее',
  back: 'Назад',
  choice: 'С чего начнём?',
  demoAction: 'Посмотреть на демо-данных',
  demoHint: 'Год правдоподобной истории операций',
  emptyAction: 'Начать с нуля',
  emptyHint: 'Чистый счёт без операций и целей',
  stepLabel: 'Шаг {current} из {total}',
};

// Окно «О проекте» (ссылки в подвале сайта и в настройках)
export const ABOUT_PROJECT = {
  title: 'О проекте',
  close: 'Закрыть',
  sections: [
    {
      id: 'about',
      title: 'Учебный проект',
      paragraphs: [
        'Fin Money — прототип приложения для учёта личных финансов, сделанный для портфолио.',
        'Это не банк и не платёжный сервис: все деньги, операции и проценты — виртуальные.',
      ],
    },
    {
      id: 'privacy',
      title: 'Данные и конфиденциальность',
      paragraphs: [
        'Персональные данные не собираются: регистрации нет, имя и почта в профиле — вымышленные.',
        'Всё, что вы вводите, хранится только в localStorage вашего браузера и никуда не отправляется.',
        'Стереть данные можно в «Настройки → Данные».',
      ],
      // Добавляется в раздел, только когда на сайте включены Метрика или Sentry (utils/monitoring.js)
      monitoringParagraph:
        'Чтобы улучшать сайт, мы считаем посещения через Яндекс Метрику (без записи действий на экране) и собираем отчёты об ошибках через Sentry. Ваши операции, суммы и цели туда не передаются.',
    },
  ],
};

// ───────────── Даты и валюты ─────────────

export const DATE_TEXTS = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  months: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  // Порядок как у Date.getDay(): воскресенье — 0
  weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  // Формы слова для чисел: 1 месяц, 2 месяца, 5 месяцев
  monthWords: ['месяц', 'месяца', 'месяцев'],
  // Приветствие на «Главной» по времени суток: [час начала, текст]
  greetings: [
    [5, 'Доброе утро!'],
    [12, 'Добрый день!'],
    [18, 'Добрый вечер!'],
    [23, 'Доброй ночи!'],
  ],
};

// Валюты отображения. Деньги в прототипе виртуальные и хранятся в рублях;
// rate — условный курс для пересчёта при показе (1 ₽ = rate единиц валюты).
export const CURRENCIES = {
  rub: { symbol: '₽', rate: 1, quickAmounts: [500, 1000, 5000], savingsQuick: [1000, 5000, 10000] },
  usd: { symbol: '$', rate: 0.0125, quickAmounts: [5, 10, 50], savingsQuick: [10, 50, 100] },
  eur: { symbol: '€', rate: 0.0115, quickAmounts: [5, 10, 50], savingsQuick: [10, 50, 100] },
};

// Текстовые описания графиков для экранных дикторов ({…} — подстановки)
export const CHART_A11Y = {
  spending: 'Диаграмма расходов: всего {total}, больше всего — {label}: {max}',
  spendingEmpty: 'Диаграмма расходов: расходов нет',
  comparison: 'Доходы и расходы по месяцам: {items}',
  comparisonItem: '{label} — доходы {income}, расходы {expenses}',
  balance: 'График баланса накоплений: от {first} до {last}',
  donut: 'Структура: {items}',
};

// ───────────── Категории операций ─────────────

// Иконки, из которых собираются категории (и встроенные, и созданные пользователем)
export const CATEGORY_ICONS = {
  food: Utensils,
  cart: ShoppingCart,
  coffee: Coffee,
  car: Car,
  plane: Plane,
  star: Star,
  movie: Clapperboard,
  house: House,
  phone: Smartphone,
  health: Pill,
  sport: Dumbbell,
  clothes: Shirt,
  pet: PawPrint,
  study: GraduationCap,
  heart: Heart,
  gift: Gift,
  salary: Briefcase,
  laptop: Laptop,
  percent: Percent,
  growth: TrendingUp,
  shield: ShieldCheck,
  other: Ellipsis,
};

// Подписи иконок для экранных дикторов (в выборе иконки видна только картинка)
export const CATEGORY_ICON_LABELS = {
  food: 'Еда',
  cart: 'Покупки',
  coffee: 'Кофе',
  car: 'Транспорт',
  plane: 'Путешествия',
  star: 'Развлечения',
  movie: 'Кино',
  house: 'Дом',
  phone: 'Связь',
  health: 'Здоровье',
  sport: 'Спорт',
  clothes: 'Одежда',
  pet: 'Питомцы',
  study: 'Учёба',
  heart: 'Близкие',
  gift: 'Подарки',
  salary: 'Работа',
  laptop: 'Техника',
  percent: 'Проценты',
  growth: 'Рост',
  shield: 'Безопасность',
  other: 'Другое',
};

// Цвета, которые можно выбрать для категории, и их названия
export const CATEGORY_ACCENTS = ['green', 'blue', 'purple', 'orange', 'pink', 'brand', 'gray'];
export const ACCENT_LABELS = {
  green: 'Зелёный',
  blue: 'Синий',
  purple: 'Фиолетовый',
  orange: 'Оранжевый',
  pink: 'Розовый',
  brand: 'Тёмно-зелёный',
  gray: 'Серый',
};

// Категории при первом запуске. type — 'expense' или 'income'.
export const DEFAULT_CATEGORIES = [
  { id: 'food', type: 'expense', name: 'Еда', iconId: 'food', accent: 'green' },
  { id: 'transport', type: 'expense', name: 'Транспорт', iconId: 'car', accent: 'blue' },
  { id: 'fun', type: 'expense', name: 'Развлечения', iconId: 'star', accent: 'purple' },
  { id: 'housing', type: 'expense', name: 'Жильё', iconId: 'house', accent: 'orange' },
  { id: 'other', type: 'expense', name: 'Другое', iconId: 'other', accent: 'gray' },
  { id: 'salary', type: 'income', name: 'Зарплата', iconId: 'salary', accent: 'brand' },
  { id: 'freelance', type: 'income', name: 'Подработка', iconId: 'laptop', accent: 'blue' },
  { id: 'cashback', type: 'income', name: 'Кэшбэк', iconId: 'percent', accent: 'green' },
  { id: 'gift', type: 'income', name: 'Подарок', iconId: 'gift', accent: 'pink' },
];

// ───────────── Витрина лендинга ─────────────
// Цифры для рекламных блоков сайта. В самом приложении всё считается из истории операций.

// Сводка по счетам
export const SUMMARY = {
  balance: {
    label: 'Общий баланс',
    amount: rub(142560),
    trend: { amount: rub(12340), suffix: 'за месяц' },
    icon: Wallet,
    accent: 'green',
  },
  income: { label: 'Доходы', amount: rub(86400), trend: { percent: 18 }, icon: ArrowUp, accent: 'green' },
  expenses: { label: 'Расходы', amount: rub(63200), trend: { percent: 6 }, icon: ArrowDown, accent: 'pink' },
};

// Счёт, который есть всегда: на нём переводы в накопления и цели. Сюда же переносятся данные,
// сохранённые до появления нескольких счетов.
export const DEFAULT_ACCOUNT = { id: 'main', name: 'Основной счёт' };

// Общий список счетов: подпись выбора и вариант «все счета» (фильтр на экране «Операции»)
export const ACCOUNT_SELECT = { label: 'Счёт', all: 'Все счета' };

// Месячные лимиты по категориям расходов: «Главная», «Аналитика», «Настройки», уведомления
export const CATEGORY_BUDGETS = {
  title: 'Бюджеты по категориям',
  description: 'Месячные лимиты на категории расходов. Предупредим, когда лимит почти исчерпан.',
  empty: 'Лимитов пока нет. Задайте, сколько готовы тратить в месяц, например, на еду или развлечения.',
  add: 'Задать лимит',
  // Порог (в процентах), после которого лимит подсвечивается
  warnAt: 80,
  spentOf: '{spent} из {limit}',
  left: 'Осталось {amount}',
  warning: 'Почти исчерпан · осталось {amount}',
  over: 'Превышен на {amount}',
  // Строка под категорией на «Аналитике» (только для периода «Месяц»)
  analyticsLine: 'Лимит {limit}',
  edit: 'Изменить лимит «{name}»',
  delete: 'Убрать лимит «{name}»',
  added: 'Лимит задан',
  saved: 'Лимит сохранён',
  deleted: 'Лимит убран',
  allSet: 'Лимиты заданы для всех категорий расходов',
  dialog: {
    addTitle: 'Лимит на категорию',
    editTitle: 'Изменить лимит',
    categoryLabel: 'Категория',
    amountLabel: 'Лимит в месяц',
    amountError: 'Введите сумму больше нуля, например 10000',
    // Подсказка из истории операций
    average: 'В среднем за последние 3 месяца — {amount} в месяц',
    useAverage: 'Взять эту сумму',
    noHistory: 'За последние 3 месяца трат в этой категории не было',
    create: 'Задать',
    save: 'Сохранить',
    remove: 'Убрать лимит',
    cancel: 'Отмена',
  },
};

// Категории расходов (сумма = SUMMARY.expenses.amount, доли = 100%)
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Еда', amount: rub(20200), share: 32, accent: 'green', icon: Utensils },
  { id: 'transport', name: 'Транспорт', amount: rub(11400), share: 18, accent: 'blue', icon: Car },
  { id: 'fun', name: 'Развлечения', amount: rub(9500), share: 15, accent: 'purple', icon: Star },
  { id: 'housing', name: 'Жильё', amount: rub(7600), share: 12, accent: 'orange', icon: House },
  { id: 'other', name: 'Другое', amount: rub(14500), share: 23, accent: 'gray', icon: Ellipsis },
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
  balance: rub(52000),
  trend: { amount: rub(4200), suffix: 'за месяц' },
  depositAction: 'Пополнить',
  withdrawAction: 'Снять',
};

// История баланса накопительного счёта по периодам (витрина лендинга; экран «Накопления» считает свою)
export const SAVINGS_PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
];

export const SAVINGS_HISTORY = {
  week: [
    { label: 'Пн', value: rub(50900) },
    { label: 'Вт', value: rub(51050) },
    { label: 'Ср', value: rub(51020) },
    { label: 'Чт', value: rub(51400) },
    { label: 'Пт', value: rub(51380) },
    { label: 'Сб', value: rub(51760) },
    { label: 'Вс', value: rub(52000) },
  ],
  month: [
    { label: '1 мая', value: rub(47800) },
    { label: '3 мая', value: rub(48150) },
    { label: '5 мая', value: rub(47950) },
    { label: '7 мая', value: rub(48400) },
    { label: '9 мая', value: rub(48300) },
    { label: '11 мая', value: rub(48900) },
    { label: '12 мая', value: rub(49300) },
    { label: '14 мая', value: rub(49100) },
    { label: '16 мая', value: rub(49700) },
    { label: '18 мая', value: rub(49550) },
    { label: '20 мая', value: rub(50200) },
    { label: '22 мая', value: rub(50050) },
    { label: '24 мая', value: rub(50700) },
    { label: '26 мая', value: rub(50900) },
    { label: '28 мая', value: rub(51500) },
    { label: '31 мая', value: rub(52000) },
  ],
  year: [
    { label: 'Июн', value: rub(8000) },
    { label: 'Июл', value: rub(11500) },
    { label: 'Авг', value: rub(14200) },
    { label: 'Сен', value: rub(18900) },
    { label: 'Окт', value: rub(21300) },
    { label: 'Ноя', value: rub(25800) },
    { label: 'Дек', value: rub(31000) },
    { label: 'Янв', value: rub(33400) },
    { label: 'Фев', value: rub(37900) },
    { label: 'Мар', value: rub(42100) },
    { label: 'Апр', value: rub(47800) },
    { label: 'Май', value: rub(52000) },
  ],
};

// Переводы между основным и накопительным счётом в списке операций «Главной».
// Это не доход и не расход: меняется только общий баланс.
export const SAVINGS_TRANSFER = {
  category: 'Накопления',
  icon: PiggyBank,
  accent: 'brand',
  titles: { deposit: 'Пополнение накоплений', withdraw: 'Снятие с накоплений' },
};

// Пополнение финансовой цели: деньги уходят с основного счёта, как и в накопления
export const GOAL_TRANSFER = {
  category: 'Цели',
  icon: Target,
  accent: 'blue',
  titlePrefix: 'Пополнение цели',
  returnPrefix: 'Возврат с цели',
};

// Общий потолок суммы одной операции во всех диалогах
export const AMOUNT_LIMIT = {
  max: rub(10000000),
  error: 'Максимальная сумма одной операции',
};

// ───────────── Экран «Накопления» ─────────────

// Типы операций по накопительному счёту: иконка, цвет и подпись
export const SAVINGS_TX_TYPES = {
  deposit: { label: 'Пополнения', title: 'Пополнение', icon: ArrowUpRight, accent: 'green' },
  interest: { label: 'Проценты', title: 'Проценты', icon: Percent, accent: 'brand' },
  withdraw: { label: 'Снятия', title: 'Снятие', icon: ArrowDownLeft, accent: 'pink' },
};

export const SAVINGS_PAGE = {
  // Годовая ставка в процентах (для калькулятора)
  annualRate: 12,
  // День месяца, когда начисляются проценты
  interestDay: 10,
  interest: {
    title: 'Доход по процентам',
    monthLabel: 'Начислено за {month}',
    totalLabel: 'За всё время',
    nextLabel: 'Следующее начисление',
    rateLabel: 'Ставка',
    rateValue: 'до 12% годовых',
  },
  trendSuffix: 'за месяц',
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
    defaults: { monthly: rub(5000), term: 12 },
    ranges: {
      monthly: { min: 0, max: rub(50000), step: rub(1000) },
      term: { min: 1, max: 36, step: 1 },
    },
  },
  history: { title: 'История', allFilter: 'Все', empty: 'Операций этого типа пока нет', emptyAll: 'Пополните счёт — здесь появится история' },
  periods: [
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'year', label: 'Год' },
  ],
  goals: { title: 'Копите на цели', allLink: 'Все цели', empty: 'Целей пока нет' },
  // Диалог пополнения / снятия
  dialog: {
    deposit: { title: 'Пополнить счёт', confirm: 'Пополнить', done: 'Накопительный счёт пополнен' },
    withdraw: { title: 'Снять со счёта', confirm: 'Снять', done: 'Деньги переведены на основной счёт' },
    amountLabel: 'Сумма',
    amountPlaceholder: '0',
    available: 'Доступно',
    availableMain: 'На основном счёте',
    cancel: 'Отмена',
    errorTooMuch: 'Сумма больше баланса счёта',
    errorNoFunds: 'Недостаточно средств на основном счёте',
    fillMax: 'Ввести максимум',
  },
};

// ───────────── Экран «Аналитика» ─────────────

export const ANALYTICS_PAGE = {
  defaultPeriod: 'month',
  periods: [
    { id: 'day', label: 'День', chartTitle: 'Расходы по часам' },
    { id: 'week', label: 'Неделя', chartTitle: 'Расходы по дням' },
    { id: 'month', label: 'Месяц', chartTitle: 'Расходы по дням' },
    { id: 'year', label: 'Год', chartTitle: 'Расходы по месяцам' },
  ],
  prevLabel: 'Предыдущий период',
  nextLabel: 'Следующий период',
  kpi: {
    expenses: 'Расходы',
    perDay: 'В среднем за день',
    topCategory: 'Крупнейшая категория',
    vsPrevious: 'к прошлому периоду',
    noPrevious: 'нет данных за прошлый период',
    shareOfTotal: 'от всех расходов',
    noTopCategory: 'Нет расходов',
  },
  categories: { title: 'Категории', allLink: 'Все', empty: 'За этот период расходов нет' },
  comparison: { title: 'Доходы и расходы', subtitle: 'За последние 6 месяцев', income: 'Доходы', expenses: 'Расходы' },
  // Подсказки собираются из истории операций; {…} — подстановки
  insights: {
    title: 'Подсказки',
    empty: 'Добавьте несколько операций — здесь появятся подсказки по тратам.',
    less: { icon: TrendingDown, accent: 'brand', text: 'В этом месяце вы потратили на {amount} меньше, чем за те же дни прошлого. Так держать!' },
    more: { icon: TrendingUp, accent: 'pink', text: 'В этом месяце вы потратили на {amount} больше, чем за те же дни прошлого. Стоит присмотреться к тратам.' },
    top: { text: '{name} — самая крупная категория месяца: {share}% всех трат.' },
    weekendMore: { icon: CalendarDays, accent: 'purple', text: 'В выходные вы тратите примерно в {ratio} раза больше, чем в будни.' },
    weekdayMore: { icon: CalendarDays, accent: 'purple', text: 'В будни вы тратите примерно в {ratio} раза больше, чем в выходные.' },
    goal: { icon: Target, accent: 'blue', text: 'До цели «{name}» осталось {left} — это около {payment} в месяц до срока.' },
  },
};

// ───────────── Экран «Операции» (полная история) ─────────────

export const TRANSACTIONS_PAGE = {
  searchPlaceholder: 'Поиск по названию или категории',
  filters: [
    { id: 'all', label: 'Все' },
    { id: 'expense', label: 'Расходы' },
    { id: 'income', label: 'Доходы' },
    { id: 'transfer', label: 'Переводы' },
  ],
  allCategories: 'Все категории',
  categoryLabel: 'Категория',
  resetFilters: 'Сбросить фильтры',
  totals: { income: 'Доходы', expenses: 'Расходы', count: 'Операций' },
  empty: 'Ничего не нашлось. Попробуйте изменить поиск или фильтры.',
  emptyAll: 'Операций пока нет',
  addFirst: 'Добавить операцию',
  showMore: 'Показать ещё',
  // Сколько операций показывать за раз
  pageSize: 40,
  exportAction: 'Экспорт CSV',
  importAction: 'Импорт выписки',
  sortAction: 'Разобрать «Другое»',
  exported: 'Файл с операциями скачан',
};

// Экспорт и импорт операций в CSV
export const CSV_TEXTS = {
  fileName: 'fin-money-operations',
  // Заголовки выгрузки (в этом же формате файл можно загрузить обратно)
  header: ['Дата', 'Тип', 'Категория', 'Комментарий', 'Сумма, ₽', 'Счёт'],
  types: { income: 'Доход', expense: 'Расход', transfer: 'Перевод' },
  // Как могут называться столбцы в выписках банков (после приведения к нижнему регистру).
  // Порядок — приоритет: из «Суммы платежа» (в валюте счёта) и «Суммы операции» (в валюте покупки) берём первую.
  columns: {
    date: ['дата', 'дата операции', 'дата и время', 'дата платежа', 'date'],
    amount: ['сумма платежа', 'сумма в валюте счета', 'сумма', 'сумма операции', 'amount'],
    // Выписки, где поступления и списания в разных столбцах
    credit: ['приход', 'поступление', 'зачисление', 'поступления', 'зачисления'],
    debit: ['расход', 'списание', 'списания'],
    description: ['комментарий', 'описание', 'описание операции', 'назначение платежа', 'description'],
    category: ['категория', 'category'],
    type: ['тип', 'тип операции', 'type'],
    status: ['статус', 'статус операции', 'status'],
  },
  // Эти столбцы ищем только по точному названию: «Тип счёта» — не тип операции
  exactColumns: ['type', 'status'],
  // Слова в столбце «Тип», по которым понятно направление операции
  incomeWords: ['доход', 'пополнение', 'зачисление', 'income'],
  transferWords: ['перевод', 'transfer'],
  // Перевод между своими счетами: не доход и не расход. Ищем в описании и категории банка.
  ownTransferWords: [
    'между своими',
    'между счетами',
    'своих счетов',
    'собственных счетов',
    'на свой счет',
    'со своего счета',
    'внутренний перевод',
    'накопительный счет',
    'на накопительный',
    'с накопительного',
    'пополнение вклада',
    'на вклад',
    'со вклада',
    'копилк',
  ],
  // Поступление с этими словами — возврат покупки: уменьшает расходы, а не добавляет доход
  refundWords: ['возврат', 'отмена покупки', 'отмена операции', 'refund'],
  // Статусы неудачных операций: деньги не списаны, в учёт не берём
  failedWords: ['failed', 'отклон', 'отменен', 'ошибк', 'не выполн', 'неуспеш'],
};

// Перевод между своими счетами из выписки: в списке операций, но вне доходов и расходов
export const IMPORT_TRANSFER = {
  category: 'Переводы',
  icon: ArrowLeftRight,
  accent: 'gray',
  title: 'Перевод между своими счетами',
};

// Категория для поступлений, которые не удалось разнести: добавляется при первом импорте
export const IMPORT_FALLBACK_INCOME = { id: 'other-income', type: 'income', name: 'Прочие доходы', iconId: 'other', accent: 'gray' };

/*
 * Автокатегории при импорте: слова из категории банка или описания операции → категория Fin Money.
 * categoryId — стандартная категория, iconId — запасной поиск, если её переименовали или пересоздали.
 * Слова в нижнем регистре, «ё» → «е»; совпадение по части слова («супермаркет» найдёт «Супермаркеты»).
 * Сначала проверяется категория банка, потом описание, порядок записей — приоритет.
 */
export const AUTO_CATEGORIES = [
  {
    categoryId: 'food',
    iconId: 'food',
    type: 'expense',
    words: ['супермаркет', 'продукт', 'ресторан', 'кафе', 'фастфуд', 'кофе', 'кофейн', 'пекарн', 'столов', 'доставка еды', 'produkty', 'kofe', 'kafe', 'restoran', 'pizza', 'burger', 'pekarnya', 'grocery'],
  },
  {
    categoryId: 'transport',
    iconId: 'car',
    type: 'expense',
    words: ['транспорт', 'такси', 'метро', 'автобус', 'электричк', 'проезд', 'азс', 'топливо', 'бензин', 'парковк', 'каршеринг', 'taksi', 'taxi', 'metro', 'parking'],
  },
  {
    categoryId: 'housing',
    iconId: 'house',
    type: 'expense',
    words: ['коммунальн', 'жку', 'жкх', 'квартплат', 'аренд', 'связь', 'интернет', 'электроэнерг', 'водоснабж', 'газоснабж'],
  },
  {
    categoryId: 'fun',
    iconId: 'star',
    type: 'expense',
    words: ['развлечен', 'кино', 'театр', 'концерт', 'музе', 'подписк', 'cinema', 'kino', 'teatr'],
  },
  { categoryId: 'salary', iconId: 'salary', type: 'income', words: ['зарплат', 'заработная плата', 'аванс', 'оплата труда', 'salary'] },
  { categoryId: 'cashback', iconId: 'percent', type: 'income', words: ['кэшбэк', 'кешбэк', 'cashback'] },
  { categoryId: 'freelance', iconId: 'laptop', type: 'income', words: ['гонорар', 'самозанят', 'фриланс', 'freelance'] },
];

// Слова, которые не отличают один магазин от другого: без них «METRO Moskva RUS. Операция по карте ****0000»
// и «Возврат покупки. METRO Moskva RUS» дают один ключ, и правило для покупки подходит к возврату
export const MERCHANT_KEY_NOISE = [
  'операция', 'по', 'карте', 'возврат', 'покупки', 'покупка', 'за', 'оплата',
  'январь', 'января', 'февраль', 'февраля', 'март', 'марта', 'апрель', 'апреля', 'май', 'мая', 'июнь', 'июня',
  'июль', 'июля', 'август', 'августа', 'сентябрь', 'сентября', 'октябрь', 'октября', 'ноябрь', 'ноября', 'декабрь', 'декабря',
];

// Разбор импортированных операций, попавших в «Другое» и «Прочие доходы»
export const SORT_OTHER_DIALOG = {
  title: 'Разобрать «Другое»',
  hint: 'Операции из выписок без своей категории, по магазинам. Выбранная категория запомнится для следующих выписок.',
  empty: 'Всё разобрано: у импортированных операций есть категории.',
  noDescription: 'Без описания',
  count: ['операция', 'операции', 'операций'],
  categoryLabel: 'Категория для «{name}»',
  save: 'Сохранить',
  cancel: 'Отмена',
  done: 'Категории обновлены: {count}',
};

export const IMPORT_DIALOG = {
  title: 'Импорт выписки',
  hint: 'Загрузите PDF-выписку по карте Сбербанка, CSV-выписку из банка или файл, выгруженный из Fin Money. В CSV нужны столбцы с датой и суммой (одной со знаком или «Приход» и «Расход»). Перед загрузкой вы увидите все операции и сможете их поправить.',
  reading: 'Читаем файл…',
  pdfUnknown: 'Не нашли операций в этом PDF. Пока поддерживается выписка по карте Сбербанка из СберБанк Онлайн; сканы и фотографии не подходят.',
  dropLabel: 'Выберите файл или перетащите его сюда',
  dropActive: 'Отпустите, чтобы загрузить',
  chooseFile: 'Выбрать файл',
  // Выбор счёта (если счетов несколько): повторы ищутся среди операций этого счёта
  accountLabel: 'Чья это выписка',
  accountNote: 'Счёт: {name}',
  found: 'К импорту: {count} из {total}',
  income: 'Доходы',
  expenses: 'Расходы',
  refunds: 'Возвраты покупок: {amount} — уменьшат расходы',
  transfers: 'Переводов между своими счетами: {count} — в доходы и расходы не входят',
  preview: 'Проверьте операции',
  previewHint: 'Категорию можно поменять — она поменяется и у похожих строк. Лишнюю строку — снять галочку.',
  rulesNote: 'Запомним для похожих операций в следующих выписках: {count}',
  include: 'Импортировать строку {line}',
  categoryLabel: 'Категория строки {line}',
  transferOption: 'Перевод между своими счетами',
  incomeGroup: 'Доход',
  refundGroup: 'Возврат покупки',
  expenseGroup: 'Расход',
  refundBadge: 'возврат',
  showMore: 'Показать ещё',
  // Строки, которые не попадут в импорт, и почему
  skipped: 'Не импортируется строк: {count}',
  reasons: {
    duplicate: 'уже есть в Fin Money',
    future: 'дата в будущем',
    failed: 'операция не выполнена',
    invalid: 'нет даты или суммы',
    tooLarge: 'сумма больше 10 000 000 ₽',
  },
  noColumns: 'Не нашли столбцы с датой и суммой. Проверьте, что в первой строке файла есть заголовки.',
  empty: 'В файле нет операций, которые можно добавить.',
  readError: 'Не удалось прочитать файл',
  confirm: 'Импортировать',
  another: 'Другой файл',
  cancel: 'Отмена',
  done: 'Импортировано операций: {count}',
  // Шаги импорта над содержимым окна
  steps: ['Файл', 'Проверка', 'Итог'],
  stepsLabel: 'Шаги импорта',
  // Образец выписки с вымышленными данными (кнопки «Пример выписки»)
  sampleError: 'Не удалось загрузить пример выписки. Проверьте интернет и попробуйте ещё раз.',
  sampleHint: 'Нет выписки под рукой?',
  sampleAction: 'Загрузить пример',
  // Отчёт после импорта
  report: {
    title: 'Что нашли в выписке',
    period: '{from} — {to}',
    count: 'добавлено операций: {count}',
    topTitle: 'Больше всего потратили',
    largestTitle: 'Крупные траты',
    other: 'Без своей категории: {count} {word}. Разберите их — следующие выписки разложатся по категориям сами.',
    otherWords: ['операция', 'операции', 'операций'],
    sortAction: 'Разобрать «Другое»',
    reconcileHint: 'Чтобы баланс совпадал с банком до копейки, сверьте остаток: «Настройки» → «Деньги» → «Счета».',
    analyticsAction: 'Открыть аналитику',
    finish: 'Готово',
  },
};

// ───────────── Экран «Цели» ─────────────

// Иконки, из которых можно выбрать цель. id совпадают с ключами CATEGORY_ICONS —
// по ним иконка восстанавливается после перезагрузки страницы.
export const GOAL_ICON_OPTIONS = [
  // label — подпись для экранных дикторов (на экране видна только иконка)
  { id: 'plane', icon: Plane, accent: 'green', label: 'Путешествие' },
  { id: 'laptop', icon: Laptop, accent: 'purple', label: 'Техника' },
  { id: 'car', icon: Car, accent: 'blue', label: 'Автомобиль' },
  { id: 'house', icon: House, accent: 'orange', label: 'Жильё' },
  { id: 'gift', icon: Gift, accent: 'pink', label: 'Подарок' },
  { id: 'study', icon: GraduationCap, accent: 'brand', label: 'Учёба' },
  { id: 'shield', icon: ShieldCheck, accent: 'orange', label: 'Подушка безопасности' },
  { id: 'heart', icon: Heart, accent: 'pink', label: 'Для близких' },
];

// Быстрый выбор срока цели (в месяцах от сегодня)
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
    edit: 'Изменить цель',
    delete: 'Удалить цель',
  },
  // Подпись срока цели
  deadline: { before: 'до', overdue: 'Срок прошёл' },
  empty: 'Здесь пока нет целей',
  emptyHint: 'Создайте первую цель — например, на отпуск или новый телефон.',
  distribution: { title: 'Распределение накоплений', caption: 'накоплено', empty: 'Пока ничего не накоплено' },
  created: 'Цель создана',
  updated: 'Цель сохранена',
  deleteDialog: {
    title: 'Удалить цель?',
    refund: 'Накопленные {amount} вернутся на основной счёт.',
    noRefund: 'На цели пока ничего не накоплено.',
    confirm: 'Удалить',
    cancel: 'Отмена',
    done: 'Цель удалена',
  },
  // Диалог пополнения цели (переиспользует AmountDialog)
  depositDialog: {
    titlePrefix: 'Пополнить цель',
    confirm: 'Пополнить',
    amountLabel: 'Сумма',
    amountPlaceholder: '0',
    available: 'Осталось накопить',
    cancel: 'Отмена',
    errorTooMuch: 'Сумма больше, чем осталось до цели',
    errorNoFunds: 'Недостаточно средств на основном счёте',
    fillMax: 'Ввести максимум',
  },
  // Диалог создания и изменения цели
  createDialog: {
    title: 'Новая цель',
    editTitle: 'Изменить цель',
    nameLabel: 'Название',
    namePlaceholder: 'Например, «Велосипед»',
    targetLabel: 'Сколько нужно накопить',
    termLabel: 'Срок',
    termSuffix: 'мес.',
    deadlineLabel: 'Дата',
    iconLabel: 'Иконка',
    perMonthHint: 'Ежемесячный взнос составит',
    pastDeadline: 'Выберите дату в будущем',
    targetBelowSaved: 'Уже накоплено {amount} — сумма цели не может быть меньше',
    confirm: 'Создать цель',
    save: 'Сохранить',
    cancel: 'Отмена',
  },
};

// ───────────── Экран «Настройки» ─────────────

export const SETTINGS_PAGE = {
  saved: 'Изменения сохранены',
  // Разделы-вкладки. Первый открывается по умолчанию; профиль в шапке ведёт в «Профиль».
  sections: {
    label: 'Разделы настроек',
    items: [
      { id: 'money', label: 'Деньги', icon: Wallet, hint: 'Бюджет, лимиты категорий, счета, категории и правила' },
      { id: 'data', label: 'Данные', icon: Database, hint: 'Загруженные выписки и демо-данные' },
      { id: 'profile', label: 'Профиль', icon: User, hint: 'Личные данные, вход и безопасность' },
      { id: 'app', label: 'Приложение', icon: SlidersHorizontal, hint: 'Тема, валюта, начало недели и уведомления' },
    ],
  },
  profile: {
    title: 'Профиль',
    description: 'Личные данные для входа и уведомлений',
    // Вымышленные данные для прототипа
    defaults: { name: 'Маша', email: 'masha@example.com', phone: '+7 900 000-00-00' },
    fields: [
      // required — поле нельзя оставить пустым; error — подсказка при ошибке
      { id: 'name', label: 'Имя', type: 'text', required: true, error: 'Введите имя' },
      { id: 'email', label: 'Email', type: 'email', required: true, error: 'Проверьте адрес почты' },
      { id: 'phone', label: 'Телефон', type: 'tel' },
    ],
    plan: 'Fin Money Free',
    save: 'Сохранить',
  },
  budget: {
    title: 'Месячный бюджет',
    description: 'Предупредим, когда расходы подойдут к лимиту',
    spentLabel: 'Потрачено за {month}',
    of: 'из',
    left: 'Осталось',
    over: 'Превышение',
    warning: 'Вы почти исчерпали бюджет',
    defaultLimit: rub(80000),
    range: { min: rub(20000), max: rub(200000), step: rub(5000) },
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
    // system — как в настройках устройства
    theme: {
      label: 'Тема',
      options: [{ id: 'light', label: 'Светлая' }, { id: 'dark', label: 'Тёмная' }, { id: 'system', label: 'Авто' }],
      default: 'system',
      toggleToDark: 'Включить тёмную тему',
      toggleToLight: 'Включить светлую тему',
    },
    currency: {
      label: 'Валюта',
      hint: 'Пересчёт по условному курсу',
      options: [{ id: 'rub', label: '₽' }, { id: 'usd', label: '$' }, { id: 'eur', label: '€' }],
      default: 'rub',
    },
    weekStart: { label: 'Начало недели', options: [{ id: 'mon', label: 'Пн' }, { id: 'sun', label: 'Вс' }], default: 'mon' },
    language: {
      label: 'Язык',
      // disabled — язык ещё не переведён
      options: [{ id: 'ru', label: 'Русский' }, { id: 'en', label: 'English (скоро)', disabled: true }],
      default: 'ru',
    },
  },
  security: {
    title: 'Безопасность',
    toggles: [
      { id: 'biometry', icon: Fingerprint, label: 'Вход по биометрии', hint: 'Face ID или отпечаток пальца', defaultOn: true },
      { id: 'hideBalance', icon: EyeOff, label: 'Скрывать баланс', hint: 'Суммы скрыты при открытии', defaultOn: false },
    ],
    logout: 'Выйти из аккаунта',
  },
  // Свои категории доходов и расходов
  categories: {
    title: 'Категории',
    tabs: [
      { id: 'expense', label: 'Расходы' },
      { id: 'income', label: 'Доходы' },
    ],
    add: 'Добавить',
    edit: 'Изменить «{name}»',
    delete: 'Удалить «{name}»',
    deleteQuestion: 'Удалить «{name}»? Её операции перейдут в «{fallback}».',
    deleteConfirm: 'Удалить',
    cancel: 'Отмена',
    lastOne: 'Это последняя категория этого типа — её нельзя удалить',
    added: 'Категория добавлена',
    saved: 'Категория сохранена',
    deleted: 'Категория удалена',
    dialog: {
      addTitle: 'Новая категория',
      editTitle: 'Изменить категорию',
      nameLabel: 'Название',
      namePlaceholder: 'Например, «Спорт»',
      iconLabel: 'Иконка',
      colorLabel: 'Цвет',
      create: 'Добавить',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
  },
  // Данные прототипа, сохранённые в браузере
  demo: {
    title: 'Данные',
    description: 'Операции, накопления и цели хранятся только в этом браузере. Демо-история строится от сегодняшнего дня.',
    action: 'Новые демо-данные',
    confirmQuestion: 'Заменить все данные демо-историей?',
    confirm: 'Заменить',
    cancel: 'Отмена',
    done: 'Демо-данные обновлены',
    emptyAction: 'Начать с нуля',
    emptyQuestion: 'Удалить все операции, накопления и цели?',
    emptyConfirm: 'Удалить',
    emptyDone: 'Все данные удалены',
    about: 'О проекте и данных',
  },
  imports: {
    title: 'История импорта',
    description: 'Загруженные выписки. Импорт можно отменить — его операции удалятся.',
    empty: 'Выписок пока не загружали.',
    emptyAction: 'Загрузить выписку',
    count: ['операция', 'операции', 'операций'],
    undo: 'Отменить',
    undoLabel: 'Отменить импорт {name}',
    undoQuestion: 'Отменить импорт «{name}»?',
    undoText: 'Удалятся операции из этого файла: {count}, в том числе изменённые после загрузки.',
    undoConfirm: 'Удалить операции',
    cancel: 'Отмена',
    undone: 'Импорт отменён',
  },
  // Счета: карты, наличные, вклады. Общий баланс — их сумма.
  accounts: {
    title: 'Счета',
    description: 'Карты, наличные и другие счета. Общий баланс — их сумма, у каждой выписки — свой счёт.',
    add: 'Добавить',
    primary: 'основной',
    primaryHint: 'С основного счёта пополняются накопления и цели, его нельзя удалить',
    count: ['операция', 'операции', 'операций'],
    edit: 'Изменить счёт {name}',
    delete: 'Удалить счёт {name}',
    deleteQuestion: 'Удалить счёт «{name}»?',
    deleteText: 'Вместе со счётом удалятся его операции: {count}. Это нельзя отменить.',
    deleteConfirm: 'Удалить счёт',
    cancel: 'Отмена',
    reconcile: 'Сверить с банком',
    reconcileLabel: 'Сверить счёт {name} с банком',
    // Итог последней сверки под названием счёта
    reconciledOk: 'Сверено на {date}: совпадает',
    reconciledDiff: 'Сверено на {date}: расходится на {amount}',
    added: 'Счёт добавлен',
    saved: 'Счёт сохранён',
    deleted: 'Счёт удалён',
    dialog: {
      addTitle: 'Новый счёт',
      editTitle: 'Изменить счёт',
      nameLabel: 'Название',
      namePlaceholder: 'Например, «Карта Сбера» или «Наличные»',
      openingLabel: 'Начальный остаток',
      openingHint: 'Сколько было на счёте до первой операции в Fin Money. Для кредитной карты — со знаком минус.',
      openingError: 'Введите сумму, например 1500,50',
      create: 'Добавить',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
    // Сверка остатка счёта с банком
    reconcileDialog: {
      title: 'Сверка с банком',
      intro: 'Введите остаток из банковского приложения или выписки на конец дня — сравним с балансом в Fin Money.',
      dateLabel: 'Дата',
      futureDate: 'Дата не может быть в будущем',
      bankLabel: 'Остаток в банке',
      bankError: 'Введите сумму, например 45300,50',
      appLabel: 'В Fin Money на эту дату',
      differenceLabel: 'Разница',
      matches: 'Всё сходится до копейки',
      bankMore: 'В банке на {amount} больше. Возможно, не загружено поступление или в Fin Money есть лишний расход.',
      bankLess: 'В банке на {amount} меньше. Возможно, не загружена трата или в Fin Money есть лишнее поступление.',
      reasonsTitle: 'Что проверить',
      suspects: 'Операции ровно на сумму разницы — возможно, лишние:',
      duplicates: 'Похожие повторы — одна сумма, день и описание:',
      lastDate: 'Если после {date} были ещё операции, загрузите выписку за этот период.',
      noOperations: 'До этой даты операций на счёте нет. Загрузите выписку или проверьте начальный остаток.',
      later: 'Операции после этой даты не учитываются: {count}.',
      opening: 'Если разница была с самого начала, поправьте начальный остаток.',
      fixOpening: 'Учесть разницу в начальном остатке',
      fixed: 'Начальный остаток поправлен — счёт сходится с банком',
      open: 'Открыть',
      save: 'Сохранить сверку',
      saved: 'Сверка сохранена',
      close: 'Закрыть',
    },
  },
  rules: {
    title: 'Правила категорий',
    description: 'Что запомнено при импорте выписок: операции этих магазинов сразу получат свою категорию.',
    empty: 'Правил пока нет. Поменяйте категорию при импорте — правило появится здесь.',
    deleteLabel: 'Удалить правило для «{name}»',
    deleted: 'Правило удалено',
  },
};

// ───────────── Добавление операции (кнопки «+» и «Добавить операцию») ─────────────

export const ADD_TRANSACTION = {
  title: 'Новая операция',
  editTitle: 'Изменить операцию',
  types: [
    { id: 'expense', label: 'Расход' },
    { id: 'income', label: 'Доход' },
  ],
  amountLabel: 'Сумма',
  categoryLabel: 'Категория',
  accountLabel: 'Счёт',
  dateLabel: 'Дата',
  futureDate: 'Дата не может быть в будущем',
  commentLabel: 'Комментарий',
  commentPlaceholder: 'Необязательно, например «Кофе с коллегами»',
  confirm: 'Добавить',
  save: 'Сохранить',
  cancel: 'Отмена',
  delete: 'Удалить',
  deleteQuestion: 'Удалить эту операцию?',
  success: 'Операция добавлена',
  saved: 'Изменения сохранены',
  deleted: 'Операция удалена',
};

// Карточка перевода (переводы нельзя изменить — только удалить вместе со второй стороной)
export const TRANSFER_DETAILS = {
  title: 'Перевод',
  note: 'Переводы нельзя изменить. Если удалить перевод, деньги вернутся обратно.',
  amountLabel: 'Сумма',
  dateLabel: 'Дата',
  delete: 'Удалить перевод',
  deleteQuestion: 'Удалить перевод и вернуть деньги?',
  close: 'Закрыть',
  deleted: 'Перевод удалён',
  // Перевод между своими счетами из выписки: возвращать деньги некуда, он просто удаляется
  importNote: 'Перевод между вашими счетами из выписки. Он меняет баланс, но не входит в доходы и расходы.',
  importDeleteQuestion: 'Удалить этот перевод?',
};

// ───────────── Экран «Главная» ─────────────

export const DASHBOARD = {
  // Подзаголовок в шапке: «Добрый день! Вот ваши финансы за октябрь»
  subtitle: '{greeting} Вот ваши финансы за {month}',
  hideBalanceLabel: 'Скрыть баланс',
  showBalanceLabel: 'Показать баланс',
  hiddenAmount: '••• •••',
  actions: { deposit: 'Пополнить', transfer: 'Перевести' },
  // Список счетов под балансом (если счетов больше одного)
  accountsLabel: 'По счетам',
  goal: {
    title: 'Финансовая цель',
    allLink: 'Все цели',
    progressOf: 'из',
    empty: 'Поставьте первую цель — мы рассчитаем ежемесячный взнос',
    create: 'Создать цель',
  },
  savingsCard: { title: 'Накопительный счёт', caption: 'До 12% годовых' },
  structure: { title: 'Структура расходов', caption: 'расходы', allLink: 'Все', empty: 'В этом месяце расходов пока нет' },
  // Лимиты категорий за текущий месяц; настраиваются в «Настройках». На «Главной» — самые заполненные.
  budgets: { caption: 'за {month}', settingsLink: 'Настроить', limit: 3, more: 'Все лимиты ({count})' },
  // Приглашение загрузить выписку — пока ни одной не загружали. Файл можно бросить прямо на карточку.
  statement: {
    title: 'Загрузите выписку из банка',
    text: 'PDF Сбербанка или CSV любого банка — разложим траты по категориям, покажем лимиты и аналитику. Файл читается прямо в браузере.',
    choose: 'Выбрать файл',
    sample: 'Пример выписки',
    drop: 'Отпустите файл, чтобы загрузить',
  },
  transactions: { title: 'Последние операции', allLink: 'Все', limit: 6, empty: 'Операций пока нет', addFirst: 'Добавить первую' },
  // «Перевести» — перевод на накопительный счёт
  transferDialog: { title: 'Перевести на накопления', confirm: 'Перевести', done: 'Деньги переведены на накопления' },
};

// ───────────── Веб-лендинг (экран «Приветствие») ─────────────

export const LANDING = {
  nav: [
    { id: 'home', label: 'Главная', href: '#top' },
    { id: 'how', label: 'Как это работает', href: '#how' },
    { id: 'analytics', label: 'Аналитика', href: '#overview' },
    { id: 'goals', label: 'Цели', href: '#goals' },
    { id: 'budget', label: 'Бюджет', href: '#categories' },
    { id: 'about', label: 'О приложении', href: '#about' },
  ],
  headerAction: 'Мои финансы',
  // Кнопка меню разделов на телефонах
  menuOpenLabel: 'Открыть меню',
  menuCloseLabel: 'Закрыть меню',
  hero: {
    badge: 'Разбор выписки Сбербанка за минуту',
    titleLines: ['Загрузите выписку —', 'увидите, куда уходят деньги.'],
    textLines: ['PDF Сбербанка или CSV любого банка.', 'Категории, лимиты и аналитика — без ручного ввода.'],
    action: 'Мои финансы',
    sampleAction: 'Попробовать на примере выписки',
  },
  // «Как это работает»: три шага от выписки до аналитики
  how: {
    eyebrow: 'Как это работает',
    title: 'От выписки до разбора трат — три шага',
    description: 'Вводить операции вручную не нужно: всё берётся из выписки, которую банк и так даёт бесплатно.',
    steps: [
      {
        id: 'download',
        icon: Download,
        title: 'Скачайте выписку',
        text: 'Закажите в приложении банка выписку по карте в PDF — у Сбербанка она есть в СберБанк Онлайн. Подойдёт и CSV любого банка.',
      },
      {
        id: 'upload',
        icon: FileUp,
        title: 'Загрузите её в Fin Money',
        text: 'Операции сами разложатся по категориям, повторы отсеются. Проверьте, поправьте, если нужно, и подтвердите.',
      },
      {
        id: 'analyze',
        icon: BarChart3,
        title: 'Смотрите, куда уходят деньги',
        text: 'Отчёт по выписке, аналитика по месяцам, лимиты по категориям и сверка остатка с банком.',
      },
    ],
    sampleAction: 'Попробовать на примере выписки',
    sampleHint: 'Выписка с вымышленными данными — можно смело нажимать',
  },
  // Почему выписку не страшно загружать
  privacy: {
    eyebrow: 'Данные',
    title: 'Выписка не уходит с вашего устройства',
    description: 'У Fin Money нет сервера, куда попадали бы ваши операции. Это прототип, и это его честное преимущество.',
    points: [
      { id: 'local', icon: Laptop, title: 'Читается в браузере', text: 'Файл разбирается прямо на вашем компьютере или телефоне и никуда не отправляется.' },
      { id: 'store', icon: ShieldCheck, title: 'Хранится только у вас', text: 'Операции лежат в памяти этого браузера. Другие устройства и люди их не видят.' },
      { id: 'control', icon: Undo2, title: 'Всё можно отменить', text: 'Любую загрузку можно отменить, а все данные — стереть в «Настройки → Данные».' },
    ],
    more: 'Подробнее о данных',
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
    text: 'Загрузите первую выписку и посмотрите на свои траты по-новому. Регистрация не нужна.',
    action: 'Мои финансы',
  },
  footer: {
    copyright: '© 2026 Fin Money. Учебный проект, деньги виртуальные.',
    // Открывают окно «О проекте» на нужном разделе (ABOUT_PROJECT.sections)
    links: [
      { id: 'about', label: 'О проекте' },
      { id: 'privacy', label: 'Данные и конфиденциальность' },
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
