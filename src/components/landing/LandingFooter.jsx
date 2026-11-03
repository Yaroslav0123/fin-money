import Container from './Container.jsx';
import { useAppActions } from '../../context/AppActionsContext.jsx';
import { LANDING } from '../../data/mockData.js';

// Подвал: копирайт, ссылка на «Как это сделано» и на окно «О проекте» (учебный проект, данные не собираются)
export default function LandingFooter() {
  const { footer } = LANDING;
  const { openAbout, navigate } = useAppActions();

  return (
    <footer>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{footer.copyright}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {footer.links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => (link.screen ? navigate(link.screen) : openAbout(link.id))}
              className="transition-colors duration-200 hover:text-brand"
            >
              {link.label}
            </button>
          ))}
        </div>
      </Container>
    </footer>
  );
}
