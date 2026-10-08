import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Mail, Lock, User } from 'lucide-react';
import { authService } from '../services/authService.js';
import { useToast } from '../components/Toast.jsx';

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'Enter a valid email';
    if (form.password.length < 8) er.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      er.password = 'Password needs upper, lower and a digit';
    }
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created — please sign in');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type, k, Icon, auto) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-icon">
        <Icon size={16} />
        <input id={id} type={type} className={`input ${errors[k] ? 'invalid' : ''}`}
          autoComplete={auto} value={form[k]} onChange={set(k)} />
      </div>
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </div>
  );

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-logo">
          <span className="logo-badge"><Boxes size={20} /></span>
          <h1>Inventra</h1>
        </div>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Create your account</p>

        <form onSubmit={submit} noValidate>
          {field('name', 'Full Name', 'text', 'name', User, 'name')}
          {field('email', 'Email', 'email', 'email', Mail, 'email')}
          {field('password', 'Password', 'password', 'password', Lock, 'new-password')}
          {field('confirm', 'Confirm Password', 'password', 'confirm', Lock, 'new-password')}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
