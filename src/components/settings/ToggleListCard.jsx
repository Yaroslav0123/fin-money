import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Toggle from '../ui/Toggle.jsx';
import SettingRow from './SettingRow.jsx';

// Начальное состояние переключателей из моковых данных
const initialState = (items) => Object.fromEntries(items.map((item) => [item.id, item.defaultOn]));

/**
 * Карточка со списком переключателей (уведомления, безопасность).
 * children — дополнительный контент под списком.
 */
export default function ToggleListCard({ title, items, children, className = '' }) {
  const [values, setValues] = useState(() => initialState(items));

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <SettingRow key={item.id} icon={item.icon} label={item.label} hint={item.hint}>
            <Toggle
              checked={values[item.id]}
              label={item.label}
              onChange={(checked) => setValues((prev) => ({ ...prev, [item.id]: checked }))}
            />
          </SettingRow>
        ))}
      </div>
      {children}
    </Card>
  );
}
