import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';
import mathLoginImage from '../assets/math-login.svg';

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
      caption: 'Practice with clarity',
    },
    teacher: {
      title: 'Teacher Login',
      note: 'Create questions, review progress, and guide every learner.',
      cta: 'Enter Teacher Control',
      caption: 'Guide every next step',
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
    <div className="auth-split-page">
      <div className="auth-split-shell">
        <section className="auth-art-panel">
          <img src={mathLoginImage} alt="" className="auth-art-image" />
          <div className="auth-art-shade" />
          <div className="auth-art-top">
            <div className="auth-art-logo">NexStep</div>
            <Link to="/" className="auth-back-link">back to website &gt;</Link>
          </div>
          <div className="auth-art-copy">
            <h2>{roleCopy[selectedRole].caption}</h2>
            <p>Step-by-step mathematics in the same calm blue workspace.</p>
            <div className="auth-art-dots"><span /><span /><span className="active" /></div>
          </div>
        </section>

        <main className="auth-form-panel">
          <form className="auth-form-card" onSubmit={handleSubmit}>
            <h1>{roleCopy[selectedRole].title}</h1>
            <p className="auth-form-subtitle">
              New here? <Link to="/signup">Create an account</Link>
            </p>

            {error && <div className="auth-error">{error}</div>}

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

            <div className="auth-input-grid">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? 'Signing in...' : roleCopy[selectedRole].cta}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
