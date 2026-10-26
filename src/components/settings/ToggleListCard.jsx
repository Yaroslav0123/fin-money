import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Toggle from '../ui/Toggle.jsx';
import SettingRow from './SettingRow.jsx';

// Начальное состояние переключателей из моковых данных
const initialState = (items) => Object.fromEntries(items.map((item) => [item.id, item.defaultOn]));

/**
 * Карточка со списком переключателей (уведомления, безопасность).
 * children — дополнительный контент под списком.
 * controlled — переключатели, чьё значение хранится снаружи:
 * { [id]: { checked, onChange } }. Остальные живут в состоянии карточки.
 */
export default function ToggleListCard({ title, items, controlled = {}, children, className = '' }) {
  const [values, setValues] = useState(() => initialState(items));

  const isChecked = (id) => (controlled[id] ? controlled[id].checked : values[id]);
  const handleChange = (id, checked) =>
    controlled[id] ? controlled[id].onChange(checked) : setValues((prev) => ({ ...prev, [id]: checked }));

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <SettingRow key={item.id} icon={item.icon} label={item.label} hint={item.hint}>
            <Toggle
              checked={isChecked(item.id)}
              label={item.label}
              onChange={(checked) => handleChange(item.id, checked)}
            />
          </SettingRow>
        ))}
      </div>
      {children}
    </Card>
  );
}
