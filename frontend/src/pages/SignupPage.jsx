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
    <div className="auth-page auth-home-page">
      <div className="auth-home-hero auth-home-hero-signup">
        <div className="home-ann auth-ann-left">
          <p>Pick your role,<br />then step into<br />your workspace.</p>
        </div>
        <div className="home-ann auth-ann-right">
          <p>Built for practice,<br />feedback, and<br />clear progress.</p>
        </div>

        <div className="auth-home-headline">
          <p className="home-hl">It's <span className="home-blob">+</span> time</p>
          <p className="home-hl">to <span className="home-blob home-blob-wide">join</span> your</p>
          <p className="home-hl home-hl-accent">mathematics!</p>
        </div>

        <div className="auth-home-panel auth-home-panel-signup">
          <form className="auth-card auth-home-card" onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="brand-mark" style={{ margin: '0 auto 18px' }}>Nx</div>
              <h2>Create Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Choose your account type to get started</p>
            </div>

            {error && (
              <div className="badge badge-hard" style={{ width: '100%', marginBottom: '18px', padding: '12px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div className="auth-role-switch">
              {['student', 'teacher'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`auth-role-pill ${role === r ? 'active' : ''}`}
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

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Email</label>
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }} disabled={loading} type="submit">
              {loading ? <div className="spinner"></div> : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </form>

          <div className={`auth-feature-card ${role === 'student' ? 'active' : ''}`}>
            <div className="feature-icon">+</div>
            <h3>Student Workspace</h3>
            <p>Solve problems, check answers, and listen to solution explanations.</p>
          </div>
          <div className={`auth-feature-card ${role === 'teacher' ? 'active' : ''}`}>
            <div className="feature-icon">✓</div>
            <h3>Teacher Control</h3>
            <p>Create questions, view performance, and guide your class.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
