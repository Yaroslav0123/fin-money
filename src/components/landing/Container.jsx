// Центрированный контейнер с отступами по бокам — общая сетка лендинга
export default function Container({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
