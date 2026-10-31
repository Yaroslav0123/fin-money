import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, FileText, Sparkles, Upload } from 'lucide-react';
import Button from '../ui/Button.jsx';
import IconTile from '../ui/IconTile.jsx';
import Modal from '../ui/Modal.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { useFinance } from '../../context/FinanceContext.jsx';
import { ONBOARDING } from '../../data/mockData.js';
import { fillTemplate } from '../../utils/format.js';
import { loadSampleStatement } from '../../utils/sample.js';

// Карточка выбора на последнем шаге. primary — главный вариант (выделен рамкой)
function ChoiceButton({ icon, title, hint, primary = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors duration-200 ${
        primary ? 'border-brand bg-brand-light/60 hover:bg-brand-light' : 'border-transparent bg-surface hover:border-line'
      }`}
    >
      <IconTile icon={icon} accent={primary ? 'brand' : 'gray'} />
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
    </button>
  );
}

/**
 * Знакомство с приложением при первом входе: как устроен главный сценарий
 * (скачать выписку → загрузить → смотреть разбор), затем выбор, с чего начать:
 * своя выписка, образец выписки или демо-данные. Есть и «начать с нуля» — без выписки.
 * Выписка и образец начинают с чистого счёта, чтобы разбор был только по ней.
 * Закрытие крестиком или Esc — то же, что «демо-данные».
 */
export default function OnboardingDialog({ isOpen }) {
  const { completeOnboarding, startFromScratch } = useFinance();
  const { openImport } = useAppActions();
  const [stepIndex, setStepIndex] = useState(0);
  const { steps, choices } = ONBOARDING;
  // Последний «шаг» — выбор режима
  const isChoice = stepIndex === steps.length;
  const step = steps[stepIndex];

  const startWithStatement = (source) => {
    startFromScratch();
    openImport(source);
  };

  return (
    <Modal isOpen={isOpen} title={isChoice ? ONBOARDING.choice : step.title} onClose={completeOnboarding} closeLabel={choices.demo.title}>
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
              <ChoiceButton icon={Upload} {...choices.own} primary onClick={() => startWithStatement(null)} />
              <ChoiceButton icon={FileText} {...choices.sample} onClick={() => startWithStatement(loadSampleStatement)} />
              <ChoiceButton icon={Sparkles} {...choices.demo} onClick={completeOnboarding} />
              <button
                type="button"
                onClick={startFromScratch}
                className="mt-1 justify-self-center text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-brand"
              >
                {ONBOARDING.emptyAction}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              {/* Номер шага сценария над иконкой: «Шаг 1» — скачать, «Шаг 2» — загрузить… */}
              {step.badge && (
                <span className="mb-4 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">{step.badge}</span>
              )}
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
