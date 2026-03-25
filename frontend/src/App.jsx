import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuestionsPage from './pages/QuestionsPage';
import SolvePage from './pages/SolvePage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '1.4rem' }}>∫</span>
        <span>CalcRunner</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            {user.role === 'student' && (
              <>
                <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>
                  📚 Problems
                </Link>
                <Link to="/progress" className={`nav-link ${isActive('/progress') ? 'active' : ''}`}>
                  📊 Progress
                </Link>
              </>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher" className={`nav-link ${isActive('/teacher') ? 'active' : ''}`}>
                🎓 Dashboard
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {user.username}
                <span className={`badge ${user.role === 'teacher' ? 'badge-medium' : 'badge-easy'}`} style={{ marginLeft: '8px' }}>
                  {user.role}
                </span>
              </span>
              <button className="nav-btn outline" onClick={onLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn outline">Sign In</Link>
            <Link to="/signup" className="nav-btn primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function HomePage({ user }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', padding: '24px', textAlign: 'center' }}>
      <div className="slide-up">
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>∫</div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CalcRunner
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px' }}>
          A code-runner for mathematics. Write step-by-step integral solutions and get instant validation with detailed feedback.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <button className="btn btn-primary btn-lg" onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/questions')}>
              Go to {user.role === 'teacher' ? 'Dashboard' : 'Problems'} →
            </button>
          ) : (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                Get Started →
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '800px', margin: '60px auto 0' }}>
          {[
            { icon: '📝', title: 'Step-by-Step', desc: 'Write solutions like code, line by line' },
            { icon: '⚡', title: 'Instant Validation', desc: 'Each step is verified mathematically' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Track your improvement over time' },
          ].map((f, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ marginBottom: '8px', fontSize: '1.05rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
        <Route path="/questions" element={
          <ProtectedRoute user={user}>
            <QuestionsPage />
          </ProtectedRoute>
        } />
        <Route path="/solve/:id" element={
          <ProtectedRoute user={user}>
            <SolvePage />
          </ProtectedRoute>
        } />
        <Route path="/teacher" element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute user={user} requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
