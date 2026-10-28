import { CalendarDays, ChevronDown, Coins, Languages, SunMoon } from 'lucide-react';
import Card from '../ui/Card.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import SettingRow from './SettingRow.jsx';

/**
 * Карточка «Параметры»: тема, валюта, начало недели и язык.
 * values — текущие настройки, onChange(key, value) — сохранить настройку.
 * Валюта пересчитывает все суммы по условному курсу, начало недели меняет период «Неделя» в аналитике.
 */
export default function PreferencesCard({ texts, values, onChange, className = '' }) {
  const { theme, currency, weekStart, language } = texts;

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-base font-bold text-ink">{texts.title}</h3>
      <div className="mt-2 divide-y divide-line">
        <SettingRow icon={SunMoon} label={theme.label}>
          <SegmentedControl id="pref-theme" options={theme.options} value={values.theme} onChange={(v) => onChange('theme', v)} />
        </SettingRow>
        <SettingRow icon={Coins} label={currency.label} hint={currency.hint}>
          <SegmentedControl id="pref-currency" options={currency.options} value={values.currency} onChange={(v) => onChange('currency', v)} />
        </SettingRow>
        <SettingRow icon={CalendarDays} label={weekStart.label}>
          <SegmentedControl id="pref-week" options={weekStart.options} value={values.weekStart} onChange={(v) => onChange('weekStart', v)} />
        </SettingRow>
        <SettingRow icon={Languages} label={language.label}>
          {/* Нативный select со своей стрелкой */}
          <div className="relative">
            <select
              value={values.language}
              onChange={(e) => onChange('language', e.target.value)}
              aria-label={language.label}
              className="h-9 cursor-pointer appearance-none rounded-full bg-ink/[0.04] pl-4 pr-9 text-xs font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {language.options.map((option) => (
                <option key={option.id} value={option.id} disabled={option.disabled}>
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
