import { useEffect, useRef } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { ABOUT_PROJECT } from '../../data/mockData.js';
import { isMonitoringEnabled } from '../../utils/monitoring.js';

/**
 * Окно «О проекте»: учебный проект, виртуальные деньги, персональные данные не собираются.
 * sectionId — раздел, к которому прокрутить при открытии (null — окно закрыто).
 */
export default function AboutDialog({ sectionId, onClose }) {
  const sectionRefs = useRef({});

  // Открыли по ссылке «Данные и конфиденциальность» — показываем сразу этот раздел
  useEffect(() => {
    if (sectionId) sectionRefs.current[sectionId]?.scrollIntoView({ block: 'nearest' });
  }, [sectionId]);

  return (
    <Modal isOpen={Boolean(sectionId)} title={ABOUT_PROJECT.title} onClose={onClose} closeLabel={ABOUT_PROJECT.close}>
      <div className="space-y-6">
        {ABOUT_PROJECT.sections.map((section) => (
          <section
            key={section.id}
            ref={(node) => {
              sectionRefs.current[section.id] = node;
            }}
          >
            <h3 className="text-sm font-bold text-ink">{section.title}</h3>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-secondary">
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {isMonitoringEnabled && section.monitoringParagraph && <p>{section.monitoringParagraph}</p>}
            </div>
          </section>
        ))}
      </div>
      <Button size="md" fullWidth className="mt-8" onClick={onClose}>
        {ABOUT_PROJECT.close}
      </Button>
    </Modal>
  );
}
