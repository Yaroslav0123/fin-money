/*
 * Картинка превью ссылки (1200×630) для мессенджеров и соцсетей: public/og-image.png.
 * Слева — главный сценарий сайта (загрузить выписку и увидеть разбор), справа — карточка отчёта
 * «Что нашли в выписке» с цифрами из образца выписки (samples/sber-vypiska-primer.pdf, данные вымышленные).
 *
 * Запуск: node scripts/make-og-image.js (рисует Chromium из Playwright;
 * если скачанный Chromium не запускается, PW_CHANNEL=chrome — установленный Chrome).
 * Шрифт Manrope берётся с Google Fonts, как на сайте, — нужен интернет.
 */
import { chromium } from '@playwright/test';

const OUTPUT = 'public/og-image.png';
const WIDTH = 1200;
const HEIGHT = 630;

// Цифры отчёта по образцу выписки (то же показывает приложение после импорта образца)
const REPORT = {
  period: '1 сентября — 20 октября 2026',
  income: '171 500 ₽',
  expenses: '24 434 ₽',
  categories: [
    ['Еда', 34, '#2E9470'],
    ['Жильё', 25, '#E59A3B'],
    ['Другое', 17, '#8C95A0'],
  ],
  other: 'Без своей категории: 5 операций',
};

// Фирменный знак — два листа (как ui/LeafMark.jsx, в белом варианте)
const LEAF = `
  <svg viewBox="0 0 48 34" width="62" height="44" aria-hidden="true">
    <path fill="rgba(255,255,255,0.4)" d="M1 20C4 8 16 1 30 3c-3 12-14 21-29 17Z" />
    <path fill="#fff" d="M10 31C14 17 28 8 47 9c-4 15-19 24-37 22Z" />
    <path fill="none" stroke="rgba(26,93,70,0.3)" stroke-width="1.2" stroke-linecap="round" d="M14 28C22 21 31 16 40 13" />
  </svg>`;

const categoryRows = REPORT.categories
  .map(
    ([name, share, color]) => `
      <div class="cat">
        <div class="cat-head"><span>${name}</span><span class="muted">${share}%</span></div>
        <div class="bar"><span style="width:${share * 2}%;background:${color}"></span></div>
      </div>`,
  )
  .join('');

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=block" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; position: relative;
    font-family: Manrope, sans-serif; color: #fff;
    background: linear-gradient(135deg, #134634 0%, #1A5D46 60%, #237A5B 100%);
  }
  .circle { position: absolute; border-radius: 50%; }
  .c1 { width: 520px; height: 520px; right: -140px; top: -200px; background: rgba(255,255,255,0.06); }
  .c2 { width: 380px; height: 380px; right: 280px; bottom: -260px; background: rgba(255,255,255,0.05); }
  .left { position: absolute; left: 80px; top: 92px; width: 600px; }
  .logo { display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 700; letter-spacing: -0.5px; }
  .badge { display: inline-block; margin-top: 40px; padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,0.14); font-size: 18px; font-weight: 600; }
  h1 { margin-top: 20px; font-size: 54px; line-height: 1.08; font-weight: 800; letter-spacing: -1.5px; }
  .sub { margin-top: 22px; font-size: 21px; line-height: 1.45; color: #CFE3D8; }
  .card {
    position: absolute; right: 72px; top: 96px; width: 420px; padding: 30px 32px;
    border-radius: 28px; background: #fff; color: #17201C; box-shadow: 0 30px 60px rgba(0,0,0,0.25);
  }
  .card h2 { font-size: 22px; font-weight: 800; }
  .muted { color: #656B74; }
  .period { margin-top: 4px; font-size: 15px; }
  .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
  .tile { padding: 14px 16px; border-radius: 16px; background: #F3F5F4; }
  .tile p { font-size: 14px; }
  .tile strong { display: block; margin-top: 4px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .green { color: #1B7950; }
  .label { margin-top: 22px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .cat { margin-top: 12px; }
  .cat-head { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; }
  .bar { margin-top: 6px; height: 8px; border-radius: 999px; background: #EDF0EE; overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: 999px; }
  .other { margin-top: 20px; padding: 10px 14px; border-radius: 14px; background: #FFF3E3; font-size: 15px; font-weight: 600; }
  .dot { display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 50%; background: #E59A3B; }
</style>
</head>
<body>
  <span class="circle c1"></span>
  <span class="circle c2"></span>
  <div class="left">
    <div class="logo">${LEAF}Fin Money</div>
    <span class="badge">Разбор выписки за минуту</span>
    <h1>Загрузите выписку — увидите, куда уходят деньги</h1>
    <p class="sub">PDF Сбербанка или CSV любого банка.<br />Категории, лимиты и аналитика — без ручного ввода.</p>
  </div>
  <div class="card">
    <h2>Что нашли в выписке</h2>
    <p class="period muted">${REPORT.period}</p>
    <div class="tiles">
      <div class="tile"><p class="muted">Доходы</p><strong class="green">${REPORT.income}</strong></div>
      <div class="tile"><p class="muted">Расходы</p><strong>${REPORT.expenses}</strong></div>
    </div>
    <p class="label muted">Больше всего потратили</p>
    ${categoryRows}
    <p class="other"><span class="dot"></span>${REPORT.other}</p>
  </div>
</body>
</html>`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUTPUT });
await browser.close();
console.log(`Готово: ${OUTPUT}`);
