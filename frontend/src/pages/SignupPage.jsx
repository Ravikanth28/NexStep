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
      navigate(role === 'teacher' ? '/teacher' : '/questions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>∫ CalcRunner</h1>
        <p className="subtitle">Create your account</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="form-group">
          <label>Choose your role</label>
          <div className="role-select">
            <div className={`role-option ${role === 'student' ? 'selected' : ''}`} onClick={() => setRole('student')}>
              <div className="role-icon">👨‍🎓</div>
              <div className="role-name">Student</div>
            </div>
            <div className={`role-option ${role === 'teacher' ? 'selected' : ''}`} onClick={() => setRole('teacher')}>
              <div className="role-icon">👨‍🏫</div>
              <div className="role-name">Teacher</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? <><div className="spinner"></div> Creating account...</> : 'Create Account'}
        </button>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
