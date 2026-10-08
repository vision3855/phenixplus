import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)' }}>404</div>
      <p className="muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}
