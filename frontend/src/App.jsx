import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import QuestionsPage from './pages/QuestionsPage';
import SignupPage from './pages/SignupPage';
import SolvePage from './pages/SolvePage';
import StudentDashboard from './pages/StudentDashboard';
import SubmissionReportPage from './pages/SubmissionReportPage';
import TeacherDashboard from './pages/TeacherDashboard';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-mark">Nx</div>
        <div className="brand-info">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>NexStep</div>
        </div>
      </Link>

      <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="heartbeat"></div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>ENGINE: NOMINAL</span>
        </div>
        {user ? (
          <>
            <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>Workspace</Link>
            {user.role === 'student' && (
              <Link to="/progress" className={`nav-link ${isActive('/progress') ? 'active' : ''}`}>Telemetry</Link>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher" className={`nav-link ${isActive('/teacher') ? 'active' : ''}`}>Control</Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px', paddingLeft: '16px', borderLeft: '1px solid var(--border-main)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.username}</div>
                <div className="badge badge-easy" style={{ fontSize: '0.65rem', padding: '2px 8px', marginTop: '4px' }}>{user.role}</div>
              </div>
              <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={onLogout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '10px 24px' }}>Start Free</Link>
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
    <div className="page">
      <div className="container">
        <section className="workspace-hero">
          <div>
            <div className="hero-kicker">Neural Symbolic Engine v4.0</div>
            <h1 className="hero-title">
              Mathematical <span className="text-gradient">Precision.</span><br />
              Intelligence Driven.
            </h1>
            <p className="hero-subtitle">
              A high-performance workspace for deep mathematical exploration, combining symbolic reasoning with neural accuracy.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
              {user ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/questions')}
                >
                  Enter Command Studio &rarr;
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => navigate('/signup')}>Initialize Studio</button>
                  <button className="btn btn-outline" onClick={() => navigate('/login')}>Authenticate</button>
                </>
              )}
            </div>
          </div>
          
          <div className="card" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--accent-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div className="badge badge-easy">Live Processing</div>
              <div style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>SYS-OK</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '4px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Neural Parsing</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Vector calculus, tensor fields, ODEs</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '4px', background: 'var(--accent-secondary)', borderRadius: '2px' }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Symbolic Routing</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Automated strategy selection & verification</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', opacity: 0.5 }}>
                <div style={{ width: '4px', background: 'var(--text-muted)', borderRadius: '2px' }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Resolution Engine</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Rigorous step-by-step symbolic checks</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value text-gradient">99.8%</div>
            <div className="stat-label">Model Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">12.4k</div>
            <div className="stat-label">Derivations Proved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4.0</div>
            <div className="stat-label">Engine Version</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-gradient">Instant</div>
            <div className="stat-label">Response Time</div>
          </div>
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
        <Route
          path="/questions"
          element={(
            <ProtectedRoute user={user}>
              <QuestionsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/solve/:id"
          element={(
            <ProtectedRoute user={user}>
              <SolvePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/teacher"
          element={(
            <ProtectedRoute user={user} requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/progress"
          element={(
            <ProtectedRoute user={user} requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/submission-report/:submissionId"
          element={(
            <ProtectedRoute user={user} requiredRole="student">
              <SubmissionReportPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
