import { LogOut } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ToggleListCard from './ToggleListCard.jsx';

// Карточка «Безопасность»: переключатели и выход из аккаунта.
// controlled — внешние значения переключателей (см. ToggleListCard).
export default function SecurityCard({ texts, controlled, onLogout, className = '' }) {
  return (
    <ToggleListCard title={texts.title} items={texts.toggles} controlled={controlled} className={className}>
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
