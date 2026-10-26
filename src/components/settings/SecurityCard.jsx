import { ChevronRight, LogOut } from 'lucide-react';
import Button from '../ui/Button.jsx';
import SettingRow from './SettingRow.jsx';
import ToggleListCard from './ToggleListCard.jsx';

// Карточка «Безопасность»: переключатели, ссылки и выход из аккаунта.
// controlled — внешние значения переключателей (см. ToggleListCard).
export default function SecurityCard({ texts, controlled, onLogout, className = '' }) {
  return (
    <ToggleListCard title={texts.title} items={texts.toggles} controlled={controlled} className={className}>
      <div className="divide-y divide-line border-t border-line">
        {texts.links.map((link) => (
          <SettingRow key={link.id} as="button" type="button" icon={link.icon} label={link.label} className="group">
            {link.badge && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">{link.badge}</span>
            )}
            <ChevronRight className="h-4 w-4 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" />
          </SettingRow>
        ))}
      </div>

      <Button
        variant="secondary"
        size="md"
        fullWidth
        onClick={onLogout}
        className="mt-4 bg-negative-bg text-negative hover:bg-negative/15"
      >
        <LogOut className="h-4 w-4" />
        {texts.logout}
      </Button>
    </ToggleListCard>
  );
}
