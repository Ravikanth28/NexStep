import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
      navigate(data.user.role === 'teacher' ? '/teacher' : '/questions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div>
          <div className="hero-kicker">Unified Access Portal</div>
          <h1 className="hero-title">Welcome back to <span className="text-gradient">NexStep.</span></h1>
          <p className="hero-subtitle">
            Securely authenticate to access your personal mathematical workspace, neural telemetry, and symbolic history.
          </p>
          
          <div style={{ marginTop: '40px', display: 'grid', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Secure Identity</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>End-to-end encrypted session management</div>
            </div>
            <div className="stat-card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Unified Sync</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time derivation cloud synchronization</div>
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="brand-mark" style={{ margin: '0 auto 24px' }}>Nx</div>
            <h2>Authenticate</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Enter your credentials below</p>
          </div>

          {error && (
            <div className="badge badge-hard" style={{ width: '100%', marginBottom: '24px', padding: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Neural Identity (Email)</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Security Key (Password)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '40px', justifyContent: 'center' }} disabled={loading} type="submit">
            {loading ? <div className="spinner"></div> : 'Initialize Session'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            New explorer? <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
