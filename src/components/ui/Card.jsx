// Базовая белая карточка с мягкой тенью
export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-card bg-white shadow-soft ${className}`} {...props}>
      {children}
    </Tag>
  );
}
