import { IMPORT_DIALOG } from '../data/mockData.js';

// Образец PDF-выписки Сбербанка с вымышленными данными (лежит в public/, делается scripts/make-sber-sample.js)
export const SAMPLE_STATEMENT = 'sber-vypiska-primer.pdf';

// Скачивает образец и отдаёт его как обычный файл — окно импорта читает его так же, как выбранный пользователем
export async function loadSampleStatement() {
  const response = await fetch(`${import.meta.env.BASE_URL}${SAMPLE_STATEMENT}`);
  if (!response.ok) throw new Error(IMPORT_DIALOG.sampleError);
  return new File([await response.blob()], SAMPLE_STATEMENT, { type: 'application/pdf' });
}
