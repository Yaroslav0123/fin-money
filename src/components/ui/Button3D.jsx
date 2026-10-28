// Количество полос, из которых собрана кнопка (см. .twist-btn в index.css)
const STRIPS = [0, 1, 2, 3];

/**
 * Крупная 3D-кнопка главного действия (по мотивам кнопки №37 из подборки msiter.ru).
 * При наведении или фокусе с клавиатуры четыре полосы по очереди переворачиваются
 * и открывают светлую грань, надпись переворачивается вместе с ними.
 * Анимация — на CSS (классы twist-btn в index.css), без jQuery.
 * Надпись нарисована дважды (на передней и нижней грани), вторая копия скрыта от экранных дикторов.
 */
export default function Button3D({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`twist-btn group rounded-2xl text-lg font-bold shadow-button focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 ${className}`}
      {...props}
    >
      <span className="twist-btn__strips" aria-hidden="true">
        {STRIPS.map((strip) => (
          <span key={strip} className="twist-btn__cube">
            <span className="twist-btn__face twist-btn__face--front" />
            <span className="twist-btn__face twist-btn__face--back" />
          </span>
        ))}
      </span>
      <span className="twist-btn__cube twist-btn__label">
        <span className="twist-btn__face twist-btn__face--front">{children}</span>
        <span className="twist-btn__face twist-btn__face--back" aria-hidden="true">
          {children}
        </span>
      </span>
    </button>
  );
}
