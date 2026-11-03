import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import LinkArrow from '../ui/LinkArrow.jsx';
import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import StreakMeter from '../achievements/StreakMeter.jsx';
import { fillTemplate } from '../../utils/format.js';

/**
 * Карточка «Достижения» на «Главной»: серия «в ритме», сколько получено и ряд значков.
 * achievements — из buildAchievements(); onOpen — окно со всеми достижениями.
 */
export default function AchievementsCard({ achievements, texts, onOpen, className = '' }) {
  const { items, streak } = achievements;
  const unlocked = items.filter((item) => item.unlocked);

  return (
    <Card className={`flex flex-col p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand" />
          <h3 className="text-base font-bold text-ink">{texts.title}</h3>
        </div>
        <LinkArrow onClick={onOpen}>{texts.allLink}</LinkArrow>
      </div>

      <StreakMeter streak={streak} texts={texts.streak} className="mt-5" />

      <p className="mt-5 text-xs font-semibold text-ink-muted">{fillTemplate(texts.progress, { done: unlocked.length, total: items.length })}</p>
      {/* Значки выскакивают по очереди; неполученные — серые */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {[...unlocked, ...items.filter((item) => !item.unlocked)].map((item, i) => (
          <motion.li
            key={item.id}
            title={item.title}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: i * 0.05 }}
          >
            <button type="button" onClick={onOpen} aria-label={item.title} className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <IconTile icon={item.icon} accent={item.unlocked ? item.accent : 'gray'} size="sm" className={item.unlocked ? '' : 'opacity-40'} />
            </button>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
