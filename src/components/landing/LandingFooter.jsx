import Container from './Container.jsx';
import { LANDING } from '../../data/mockData.js';

// Подвал: копирайт и юридические ссылки
export default function LandingFooter() {
  const { footer } = LANDING;

  return (
    <footer>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{footer.copyright}</p>
        <div className="flex gap-6">
          {footer.links.map((link) => (
            <a key={link.id} href={link.href} className="transition-colors duration-200 hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}
