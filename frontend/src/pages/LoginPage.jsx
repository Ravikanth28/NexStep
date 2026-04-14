import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleCopy = {
    student: {
      title: 'Student Login',
      note: 'Solve problems, check answers, and learn from guided solutions.',
      cta: 'Enter Student Workspace',
    },
    teacher: {
      title: 'Teacher Login',
      note: 'Create questions, review progress, and guide every learner.',
      cta: 'Enter Teacher Control',
    },
  };

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
    <div className="auth-page auth-home-page">
      <div className="auth-home-hero auth-home-hero-login">
        <div className="home-ann auth-ann-left">
          <p>{selectedRole === 'student' ? 'Your workspace waits' : 'Your class signals wait'}<br />right where you<br />left them.</p>
        </div>
        <div className="home-ann auth-ann-right">
          <p>Students solve.<br />Teachers guide.<br />NexStep keeps pace.</p>
        </div>

        <div className="auth-home-headline">
          <p className="home-hl">It's <span className="home-blob">Nx</span> time</p>
          <p className="home-hl">to <span className="home-blob home-blob-wide">sign in</span> again</p>
          <p className="home-hl home-hl-accent">mathematics!</p>
        </div>

        <div className="auth-home-panel">
          <form className="auth-card auth-home-card" onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div className="brand-mark" style={{ margin: '0 auto 18px' }}>Nx</div>
              <h2>{roleCopy[selectedRole].title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                {roleCopy[selectedRole].note}
              </p>
            </div>

            {error && (
              <div className="badge badge-hard" style={{ width: '100%', marginBottom: '20px', padding: '12px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div className="auth-role-switch">
              {['student', 'teacher'].map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`auth-role-pill ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>

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

            <div className="form-group" style={{ marginTop: '18px' }}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '28px', justifyContent: 'center' }} disabled={loading} type="submit">
              {loading ? <div className="spinner"></div> : roleCopy[selectedRole].cta}
            </button>

            <p style={{ textAlign: 'center', marginTop: '18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              New here? <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
            </p>
          </form>

          <button
            type="button"
            className={`auth-feature-card auth-login-choice ${selectedRole === 'student' ? 'active' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <div className="feature-icon">Nx</div>
            <h3>Student Login</h3>
            <p>Open your problem workspace and keep your progress moving.</p>
          </button>
          <button
            type="button"
            className={`auth-feature-card auth-login-choice ${selectedRole === 'teacher' ? 'active' : ''}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <div className="feature-icon">OK</div>
            <h3>Teacher Login</h3>
            <p>Return to your dashboard and review every learning signal.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
