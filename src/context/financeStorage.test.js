import { createDemoData } from '../data/demoData.js';
import { createBackup, parseBackup } from './financeStorage.js';
import { CURRENT_VERSION } from './migrations.js';

describe('резервная копия', () => {
  const state = { version: CURRENT_VERSION, ...createDemoData(new Date(2026, 9, 28)), settings: {} };

  it('копия читается обратно вместе с датой', () => {
    const date = new Date(2026, 10, 3, 12);
    const backup = parseBackup(createBackup(state, date));
    expect(backup.exportedAt).toEqual(date);
    expect(backup.data.transactions).toEqual(state.transactions);
    expect(backup.data.goals).toHaveLength(state.goals.length);
  });

  it('чужой или повреждённый файл не принимается', () => {
    expect(parseBackup('не json')).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'other', data: state }))).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'fin-money', data: { transactions: 'x' } }))).toBeNull();
  });
});
