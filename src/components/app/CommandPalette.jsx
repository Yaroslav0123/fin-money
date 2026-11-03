import { useMemo, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { APP_NAV, COMMAND_PALETTE } from '../../data/mockData.js';

const normalize = (text) => (text ?? '').toLowerCase().replace(/ё/g, 'е').trim();
const matches = (query) => (text) => normalize(text).includes(query);

/**
 * Быстрый поиск по Ctrl+K (⌘K на Mac): разделы, действия, операции и цели в одном окне.
 * Стрелки выбирают строку, Enter открывает её, Esc закрывает окно.
 * transactions — операции для показа (describe), goals — цели;
 * onNavigate(screen) — переход; onAction(id) — действие из COMMAND_PALETTE.actions; onTransaction(tx) — открыть операцию.
 */
export default function CommandPalette({ isOpen, onClose, transactions, goals, onNavigate, onAction, onTransaction }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const { groups, limit } = COMMAND_PALETTE;

  // Результаты по группам; у каждой строки — что сделать при выборе
  const sections = useMemo(() => {
    const q = normalize(query);
    const has = matches(q);
    const screens = APP_NAV.filter((item) => !q || has(item.label)).map((item) => ({
      id: `screen-${item.id}`,
      icon: item.icon,
      accent: 'brand',
      label: item.label,
      run: () => onNavigate(item.screen),
    }));
    const actions = COMMAND_PALETTE.actions.filter((item) => !q || has(item.label)).map((item) => ({
      id: `action-${item.id}`,
      icon: item.icon,
      accent: 'blue',
      label: item.label,
      run: () => onAction(item.id),
    }));
    // Операции и цели ищем только по запросу: без него список был бы слишком длинным
    const foundTx = q
      ? transactions
          .filter((tx) => has(tx.title) || has(tx.category) || has(tx.comment))
          .slice(0, limit)
          .map((tx) => ({ id: `tx-${tx.id}`, icon: tx.icon, accent: tx.accent, label: tx.title, hint: `${tx.category} · ${tx.dateLabel}`, run: () => onTransaction(tx) }))
      : [];
    const foundGoals = q
      ? goals
          .filter((g) => has(g.name))
          .slice(0, limit)
          .map((g) => ({ id: `goal-${g.id}`, icon: g.icon, accent: g.accent, label: g.name, hint: g.deadlineLabel, run: () => onNavigate('goals') }))
      : [];
    return [
      { id: 'screens', title: groups.screens, items: screens },
      { id: 'actions', title: groups.actions, items: actions },
      { id: 'transactions', title: groups.transactions, items: foundTx },
      { id: 'goals', title: groups.goals, items: foundGoals },
    ].filter((section) => section.items.length > 0);
  }, [query, transactions, goals, onNavigate, onAction, onTransaction, groups, limit]);

  const flat = sections.flatMap((section) => section.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  const choose = (item) => {
    onClose();
    setQuery('');
    item.run();
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((current + step + flat.length) % Math.max(flat.length, 1));
    } else if (e.key === 'Enter' && flat[current]) {
      e.preventDefault();
      choose(flat[current]);
    }
  };

  return (
    <Modal isOpen={isOpen} title={COMMAND_PALETTE.title} onClose={onClose} closeLabel={COMMAND_PALETTE.close}>
      <div className="flex h-12 items-center gap-3 rounded-2xl bg-surface px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
        <Search className="h-4 w-4 shrink-0 text-ink-muted" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={handleKey}
          placeholder={COMMAND_PALETTE.placeholder}
          aria-label={COMMAND_PALETTE.placeholder}
          aria-controls="command-results"
          aria-activedescendant={flat[current] ? `command-${flat[current].id}` : undefined}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      <div id="command-results" role="listbox" aria-label={COMMAND_PALETTE.title} className="mt-4 max-h-[50vh] overflow-y-auto">
        {flat.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">{COMMAND_PALETTE.empty}</p>}
        {sections.map((section) => (
          <div key={section.id} className="mb-3">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{section.title}</p>
            {section.items.map((item) => {
              const isActive = flat[current]?.id === item.id;
              return (
                <button
                  key={item.id}
                  id={`command-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(flat.indexOf(item))}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 ${isActive ? 'bg-brand-light' : ''}`}
                >
                  <IconTile icon={item.icon} accent={item.accent} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
                    {item.hint && <span className="block truncate text-xs text-ink-muted">{item.hint}</span>}
                  </span>
                  {isActive && <CornerDownLeft className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 hidden text-center text-[11px] text-ink-muted sm:block">{COMMAND_PALETTE.hint}</p>
    </Modal>
  );
}
