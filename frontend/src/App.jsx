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
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">Nx</span>
        <span>NexStep Maths Explorer</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            {user.role === 'student' && (
              <>
                <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>
                  Practice
                </Link>
                <Link to="/progress" className={`nav-link ${isActive('/progress') ? 'active' : ''}`}>
                  Progress
                </Link>
              </>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher" className={`nav-link ${isActive('/teacher') ? 'active' : ''}`}>
                Workspace
              </Link>
            )}
            <div className="nav-user">
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
            <Link to="/signup" className="nav-btn primary">Launch Platform</Link>
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
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy slide-up">
          <div className="hero-kicker">Dynamic Engineering Mathematics Platform</div>
          <h1>From syllabus to solution validation, all in one guided workspace.</h1>
          <p>
            Teachers can post fresh questions from matrices, transforms, probability, or vector calculus.
            Students can solve them line by line in a symbol-aware editor and get structured validation feedback.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/questions')}>
                Open {user.role === 'teacher' ? 'Teacher Workspace' : 'Practice Hub'}
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                  Create Account
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-orbit orbit-one"></div>
          <div className="hero-orbit orbit-two"></div>
          <div className="hero-panel card">
            <div className="hero-panel-label">Live Workflow</div>
            <div className="hero-flow-step">
              <strong>1. Teacher enters question</strong>
              <p>Raw engineering math problem text or symbolic expression.</p>
            </div>
            <div className="hero-flow-step">
              <strong>2. System maps the syllabus</strong>
              <p>Topic, unit, strategy, and difficulty are inferred dynamically.</p>
            </div>
            <div className="hero-flow-step">
              <strong>3. Student writes full steps</strong>
              <p>Every line is checked with topic-aware feedback and reference answers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-strip">
        {[
          ['Dynamic Mapping', 'Questions do not need to be pre-stored one by one.'],
          ['Step Validation', 'Students write complete working, not only final answers.'],
          ['Teacher Visibility', 'Dashboards and exports show accuracy and performance trends.'],
        ].map(([title, description]) => (
          <div key={title} className="card feature-panel">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </section>
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
        <Route path="/submission-report" element={
          <ProtectedRoute user={user} requiredRole="student">
            <SubmissionReportPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
