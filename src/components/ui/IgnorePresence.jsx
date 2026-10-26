import { PresenceContext } from 'framer-motion';

/**
 * Выводит содержимое из-под ближайшего AnimatePresence.
 * Нужно для подложек с layoutId (активный пункт меню, переключатели):
 * в framer-motion 11 такая подложка, уже переезжавшая между пунктами,
 * может навсегда задержать анимацию выхода родительского экрана
 * при AnimatePresence mode="wait" — и следующий экран не появляется.
 * Скольжение подложки между пунктами при этом сохраняется.
 */
export default function IgnorePresence({ children }) {
  return <PresenceContext.Provider value={null}>{children}</PresenceContext.Provider>;
}
