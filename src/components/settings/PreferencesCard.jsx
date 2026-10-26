import { useState } from 'react';
import { CalendarDays, ChevronDown, Coins, Languages } from 'lucide-react';
import Card from '../ui/Card.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import SettingRow from './SettingRow.jsx';

/**
 * Карточка «Параметры»: валюта, начало недели и язык.
 * В прототипе выбор только запоминается, интерфейс не перестраивается.
 */
export default function PreferencesCard({ texts, className = '' }) {
  const { currency, weekStart, language } = texts;
  const [currencyId, setCurrencyId] = useState(currency.default);
  const [weekStartId, setWeekStartId] = useState(weekStart.default);
  const [languageId, setLanguageId] = useState(language.default);

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <div className="mt-2 divide-y divide-line">
        <SettingRow icon={Coins} label={currency.label}>
          <SegmentedControl id="pref-currency" options={currency.options} value={currencyId} onChange={setCurrencyId} />
        </SettingRow>
        <SettingRow icon={CalendarDays} label={weekStart.label}>
          <SegmentedControl id="pref-week" options={weekStart.options} value={weekStartId} onChange={setWeekStartId} />
        </SettingRow>
        <SettingRow icon={Languages} label={language.label}>
          {/* Нативный select со своей стрелкой */}
          <div className="relative">
            <select
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              aria-label={language.label}
              className="h-9 cursor-pointer appearance-none rounded-full bg-black/[0.04] pl-4 pr-9 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {language.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          </div>
        </SettingRow>
      </div>
    </Card>
  );
}
