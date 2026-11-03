import Modal from '../ui/Modal.jsx';
import AchievementBadge from './AchievementBadge.jsx';
import StreakMeter from './StreakMeter.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ACHIEVEMENTS } from '../../data/mockData.js';
import { buildAchievements } from '../../utils/achievements.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * Все достижения: серия «в ритме», затем полученные и те, что ещё впереди (с прогрессом).
 */
export default function AchievementsDialog({ isOpen, onClose }) {
  const finance = useFinance();
  const { items, streak } = buildAchievements(finance);
  const unlocked = items.filter((item) => item.unlocked);
  const locked = items.filter((item) => !item.unlocked);

  return (
    <Modal isOpen={isOpen} title={ACHIEVEMENTS.dialogTitle} onClose={onClose} closeLabel={ACHIEVEMENTS.close} size="lg">
      <StreakMeter streak={streak} texts={ACHIEVEMENTS.streak} />
      <p className="mt-6 text-xs font-semibold text-ink-muted">
        {ACHIEVEMENTS.unlocked} · {fillTemplate(ACHIEVEMENTS.progress, { done: unlocked.length, total: items.length })}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {unlocked.map((item) => (
          <AchievementBadge key={item.id} item={item} texts={ACHIEVEMENTS} />
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <p className="mt-6 text-xs font-semibold text-ink-muted">{ACHIEVEMENTS.locked}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {locked.map((item) => (
              <AchievementBadge key={item.id} item={item} texts={ACHIEVEMENTS} />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
