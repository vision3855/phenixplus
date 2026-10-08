import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email and password are required');
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(params.get('redirect') || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-logo">
          <span className="logo-badge"><Boxes size={20} /></span>
          <h1>PHÉNIX-PLUS</h1>
        </div>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Sign in to your workspace</p>

        <form onSubmit={submit} noValidate>
          {error && (
            <div role="alert" style={{
              padding: '0.6rem 0.8rem', marginBottom: '1rem', fontSize: '0.85rem',
              background: 'var(--danger-soft)', color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
            }}>
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-icon">
              <Mail size={16} />
              <input id="email" type="email" className="input" autoComplete="email"
                placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <Lock size={16} />
              <input id="password" type="password" className="input" autoComplete="current-password"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
