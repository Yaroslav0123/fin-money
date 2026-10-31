import Card from '../ui/Card.jsx';
import IconTile from '../ui/IconTile.jsx';
import TrendBadge from '../ui/TrendBadge.jsx';
import AnimatedMoney from '../ui/AnimatedMoney.jsx';

// Карточка с одним показателем: иконка, подпись, сумма и динамика (или вместо неё — пояснение stat.caption)
export default function StatCard({ stat, className = '' }) {
  return (
    <Card className={`p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted ${className}`}>
      <IconTile icon={stat.icon} accent={stat.accent} />
      <p className="mt-5 text-xs font-medium text-ink-muted">{stat.label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink"><AnimatedMoney value={stat.amount} /></p>
      {stat.trend ? (
        <TrendBadge trend={stat.trend} size="sm" className="mt-3" />
      ) : (
        <p className="mt-3 text-xs font-medium text-ink-muted">{stat.caption}</p>
      )}
    </Card>
  );
}
