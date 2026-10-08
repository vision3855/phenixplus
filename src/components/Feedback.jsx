import { PackageOpen } from 'lucide-react';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex gap-2" style={{ justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div style={{ padding: '0.75rem 1rem', display: 'grid', gap: '0.85rem' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem' }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, hint }) {
  return (
    <div className="empty-state">
      <Icon size={36} strokeWidth={1.5} />
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        {hint && <div style={{ fontSize: '0.85rem' }}>{hint}</div>}
      </div>
    </div>
  );
}
