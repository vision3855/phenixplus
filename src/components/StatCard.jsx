import { TrendingUp } from 'lucide-react';

const TONES = {
  primary: { color: 'var(--primary)', bg: 'var(--primary-soft)' },
  success: { color: 'var(--success)', bg: 'var(--success-soft)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  danger:  { color: 'var(--danger)',  bg: 'var(--danger-soft)' },
  info:    { color: 'var(--info)',    bg: 'var(--info-soft)' },
};

export default function StatCard({ icon: Icon = TrendingUp, tone = 'primary', label, value, hint }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <div className="card stat-card">
      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <div className="stat-icon" style={{ background: t.bg, color: t.color }}>
          <Icon size={20} />
        </div>
        {hint && <span className="muted" style={{ fontSize: '0.75rem' }}>{hint}</span>}
      </div>
      <div className="stat-value mono">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
