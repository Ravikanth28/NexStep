import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup as apiSignup } from '../api';
import mathSignupImage from '../assets/math-signup.svg';

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
    <div className="auth-split-page">
      <div className="auth-split-shell">
        <section className="auth-art-panel">
          <img src={mathSignupImage} alt="" className="auth-art-image" />
          <div className="auth-art-shade" />
          <div className="auth-art-top">
            <div className="auth-art-logo">NexStep</div>
            <Link to="/" className="auth-back-link">back to website &gt;</Link>
          </div>
          <div className="auth-art-copy">
            <h2>{role === 'student' ? 'Start solving with confidence' : 'Build better practice'}</h2>
            <p>Blue calm, symbolic power, and a workspace made for mathematics.</p>
            <div className="auth-art-dots"><span /><span /><span className="active" /></div>
          </div>
        </section>

        <main className="auth-form-panel">
          <form className="auth-form-card" onSubmit={handleSubmit}>
            <h1>Create an account</h1>
            <p className="auth-form-subtitle">
              Already have an account? <Link to="/login">Log in</Link>
            </p>

            {error && <div className="auth-error">{error}</div>}

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

            <div className="auth-input-grid auth-input-grid-two">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
