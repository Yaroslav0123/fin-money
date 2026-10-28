import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, SquarePlus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ONBOARDING } from '../../data/mockData.js';
import { fillTemplate } from '../../utils/format.js';

/**
 * Знакомство с приложением при первом входе: несколько коротких шагов,
 * затем выбор — смотреть на демо-данных или начать с чистого счёта.
 * Закрытие крестиком или Esc — то же, что «демо-данные».
 */
export default function OnboardingDialog({ isOpen }) {
  const { completeOnboarding, startFromScratch } = useFinance();
  const [stepIndex, setStepIndex] = useState(0);
  const { steps } = ONBOARDING;
  // Последний «шаг» — выбор режима
  const isChoice = stepIndex === steps.length;
  const step = steps[stepIndex];

  return (
    <Modal isOpen={isOpen} title={isChoice ? ONBOARDING.choice : step.title} onClose={completeOnboarding} closeLabel={ONBOARDING.demoAction}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {isChoice ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={completeOnboarding}
                className="flex items-center gap-4 rounded-2xl border-2 border-brand bg-brand-light/60 p-4 text-left transition-colors duration-200 hover:bg-brand-light"
              >
                <IconTile icon={Sparkles} accent="brand" />
                <span>
                  <span className="block text-sm font-bold text-ink">{ONBOARDING.demoAction}</span>
                  <span className="block text-xs text-ink-muted">{ONBOARDING.demoHint}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={startFromScratch}
                className="flex items-center gap-4 rounded-2xl border-2 border-transparent bg-surface p-4 text-left transition-colors duration-200 hover:border-line"
              >
                <IconTile icon={SquarePlus} accent="gray" />
                <span>
                  <span className="block text-sm font-bold text-ink">{ONBOARDING.emptyAction}</span>
                  <span className="block text-xs text-ink-muted">{ONBOARDING.emptyHint}</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <IconTile icon={step.icon} accent="brand" size="lg" />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-secondary">{step.text}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Точки прогресса и кнопки «Назад» / «Далее» */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={fillTemplate(ONBOARDING.stepLabel, { current: stepIndex + 1, total: steps.length + 1 })}>
          {[...steps, null].map((_, index) => (
            <span key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === stepIndex ? 'w-5 bg-brand' : 'w-1.5 bg-ink/10'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button size="sm" pill variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
              {ONBOARDING.back}
            </Button>
          )}
          {!isChoice && (
            <Button size="sm" pill onClick={() => setStepIndex((i) => i + 1)}>
              {ONBOARDING.next}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
