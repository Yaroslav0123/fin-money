/*
 * Текст PDF построчно — для импорта выписок. Библиотека pdf.js (~350 КБ + обработчик в отдельном потоке)
 * подгружается только здесь и только когда пользователь выбрал PDF, на скорость сайта она не влияет.
 * Файл разбирается в браузере и никуда не отправляется.
 */

/**
 * PDF (ArrayBuffer) → массив строк текста сверху вниз, страница за страницей.
 * pdf.js отдаёт отдельные кусочки текста с координатами: собираем из них строки
 * по высоте на странице, а внутри строки — слева направо.
 */
export async function pdfToLines(buffer) {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  // isEvalSupported: false — pdf.js не выполняет код из файла
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;

  const lines = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const { items } = await page.getTextContent();
      lines.push(...itemsToLines(items));
    }
  } finally {
    await pdf.destroy();
  }
  return lines;
}

// Кусочки текста одной страницы → строки. Кусочки на одной высоте (с допуском в полшрифта) — одна строка.
function itemsToLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const [a, b, , , x, y] = item.transform;
    const size = Math.hypot(a, b) || 1;
    let row = rows.find((r) => Math.abs(r.y - y) < size / 2);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, end: x + item.width, size, text: item.str });
  }

  // Сверху вниз (у PDF ось Y направлена вверх), внутри строки — слева направо, с пробелом между далёкими кусочками
  return rows
    .sort((r1, r2) => r2.y - r1.y)
    .map((row) => {
      const parts = row.parts.sort((p1, p2) => p1.x - p2.x);
      return parts
        .reduce((text, part, i) => (i > 0 && part.x - parts[i - 1].end > part.size * 0.15 ? `${text} ${part.text}` : text + part.text), '')
        .replace(/\s+/g, ' ')
        .trim();
    });
}
