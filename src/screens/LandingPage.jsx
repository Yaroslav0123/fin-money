import CategoriesSection from '../components/landing/CategoriesSection.jsx';
import CtaBanner from '../components/landing/CtaBanner.jsx';
import GoalsSection from '../components/landing/GoalsSection.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import LandingHeader from '../components/landing/LandingHeader.jsx';
import OverviewSection from '../components/landing/OverviewSection.jsx';
import SavingsSection from '../components/landing/SavingsSection.jsx';
import { APP_NAME, LANDING } from '../data/mockData.js';

/**
 * Экран 1. Приветствие в виде веб-лендинга.
 * onStart — переход в приложение по любой кнопке «Начать».
 */
export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-full bg-surface pb-20">
      <LandingHeader appName={APP_NAME} nav={LANDING.nav} actionLabel={LANDING.headerAction} onAction={onStart} />
      <main>
        <HeroSection appName={APP_NAME} onStart={onStart} />
        <OverviewSection />
        <SavingsSection />
        <CategoriesSection />
        <GoalsSection />
        <CtaBanner appName={APP_NAME} onStart={onStart} />
      </main>
      <LandingFooter />
    </div>
  );
}
