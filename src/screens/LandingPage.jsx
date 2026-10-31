import CategoriesSection from '../components/landing/CategoriesSection.jsx';
import CtaBanner from '../components/landing/CtaBanner.jsx';
import GoalsSection from '../components/landing/GoalsSection.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import HowItWorksSection from '../components/landing/HowItWorksSection.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import LandingHeader from '../components/landing/LandingHeader.jsx';
import OverviewSection from '../components/landing/OverviewSection.jsx';
import PrivacySection from '../components/landing/PrivacySection.jsx';
import { useAppActions } from '../context/AppActionsContext.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { APP_NAME, LANDING } from '../data/mockData.js';
import { loadSampleStatement } from '../utils/sample.js';

/**
 * Экран 1. Приветствие в виде веб-лендинга: главный сценарий — загрузить выписку и получить разбор трат.
 * onStart — переход в приложение по любой кнопке «Мои финансы».
 * «Попробовать на примере выписки» открывает приложение и сразу загружает образец с вымышленными данными.
 */
export default function LandingPage({ onStart }) {
  const { onboardingDone, startFromScratch } = useFinance();
  const { openImport } = useAppActions();

  const handleTrySample = () => {
    // Первый визит: начинаем с чистого счёта, чтобы отчёт и аналитика были только по выписке
    if (!onboardingDone) startFromScratch();
    onStart();
    openImport(loadSampleStatement);
  };

  return (
    <div className="min-h-full bg-surface">
      <LandingHeader appName={APP_NAME} nav={LANDING.nav} actionLabel={LANDING.headerAction} onAction={onStart} />
      <main>
        <HeroSection appName={APP_NAME} onStart={onStart} onTrySample={handleTrySample} />
        <HowItWorksSection onTrySample={handleTrySample} />
        <OverviewSection />
        <CategoriesSection />
        <GoalsSection />
        <PrivacySection />
        <CtaBanner appName={APP_NAME} onStart={onStart} />
      </main>
      <LandingFooter />
    </div>
  );
}
