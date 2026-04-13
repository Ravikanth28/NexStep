import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup as apiSignup } from '../api';

export default function SignupPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiSignup({ username, email, password, role });
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
          <div className="hero-kicker">Create your account</div>
          <h1 className="hero-title">Join <span className="text-gradient">NexStep.</span></h1>
          <p className="hero-subtitle">
            Practice advanced mathematics with AI-guided feedback and step-by-step validation.
          </p>
          
          <div style={{ marginTop: '40px', display: 'grid', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '24px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>Your Workspace</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All your solutions and progress saved in one place</div>
              <div className="badge badge-easy" style={{ marginTop: '12px' }}>FREE</div>
            </div>
            <div className="stat-card" style={{ padding: '24px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>Performance Analytics</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>See where you're strong and where to improve</div>
              <div className="badge badge-easy" style={{ marginTop: '12px' }}>INCLUDED</div>
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="brand-mark" style={{ margin: '0 auto 24px' }}>Nx</div>
            <h2>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Choose your account type to get started</p>
          </div>

          {error && (
            <div className="badge badge-hard" style={{ width: '100%', marginBottom: '24px', padding: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            {['student', 'teacher'].map((r) => (
              <button
                key={r}
                type="button"
                className={`btn ${role === r ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '12px', fontSize: '0.85rem', borderRadius: '12px' }}
                onClick={() => setRole(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="e.g. john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label>Email</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }} disabled={loading} type="submit">
            {loading ? <div className="spinner"></div> : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
