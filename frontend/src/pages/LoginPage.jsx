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
          <div className="hero-kicker">Welcome back</div>
          <h1 className="hero-title">Sign in to <span className="text-gradient">NexStep.</span></h1>
          <p className="hero-subtitle">
            Access your workspace, track your progress, and continue solving problems where you left off.
          </p>
          
          <div style={{ marginTop: '40px', display: 'grid', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Your Progress</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All your submissions and scores are saved</div>
            </div>
            <div className="stat-card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>AI Feedback</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Step-by-step guidance on every problem</div>
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="brand-mark" style={{ margin: '0 auto 24px' }}>Nx</div>
            <h2>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Enter your credentials below</p>
          </div>

          {error && (
            <div className="badge badge-hard" style={{ width: '100%', marginBottom: '24px', padding: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '40px', justifyContent: 'center' }} disabled={loading} type="submit">
            {loading ? <div className="spinner"></div> : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            New here? <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
