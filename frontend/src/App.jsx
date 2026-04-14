import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import QuestionsPage from './pages/QuestionsPage';
import SignupPage from './pages/SignupPage';
import SolvePage from './pages/SolvePage';
import SolutionPage from './pages/SolutionPage';
import StudentDashboard from './pages/StudentDashboard';
import SubmissionReportPage from './pages/SubmissionReportPage';
import TeacherDashboard from './pages/TeacherDashboard';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isFeaturePage = location.pathname === '/features';
  const isAboutPage = location.pathname === '/about';
  const useHomeNav = isHome || isFeaturePage || isAboutPage;
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${useHomeNav ? 'navbar-home' : ''} ${scrolled ? 'navbar-scrolled' : ''}`}>
      <Link to="/" className="navbar-brand">
        <div className="brand-mark">Nx</div>
        <div className="brand-info">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>NexStep</div>
        </div>
      </Link>

      {useHomeNav && (
        <div className="navbar-pill-nav">
          <button className={`nav-pill-link ${isHome ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/')}>Home</button>
          <button className={`nav-pill-link ${isFeaturePage ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/features')}>Features</button>
          <button className={`nav-pill-link ${isAboutPage ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/about')}>About</button>
        </div>
      )}

      <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {user ? (
          <>
            {!useHomeNav && (
              <>
                <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>Workspace</Link>
                {user.role === 'student' && (
                  <Link to="/progress" className={`nav-link ${isActive('/progress') ? 'active' : ''}`}>Analytics</Link>
                )}
                {user.role === 'teacher' && (
                  <Link to="/teacher" className={`nav-link ${isActive('/teacher') ? 'active' : ''}`}>Control</Link>
                )}
              </>
            )}
            <div className="navbar-user-info">
              <div style={{ textAlign: 'right' }}>
                <div className="navbar-username">{user.username}</div>
                <div className={`navbar-role-badge ${user.role === 'teacher' ? 'role-teacher' : 'role-student'}`}>
                  {user.role}
                </div>
              </div>
              <button className="btn btn-outline navbar-logout-btn" onClick={onLogout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="btn btn-primary navbar-cta-btn">Start Free</Link>
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

const featureItems = [
  {
    icon: '⚡',
    title: 'Neural Parsing',
    text: 'Vector calculus, tensor fields, ODEs, transforms, and symbolic expressions stay readable from the first step.',
  },
  {
    icon: '🔀',
    title: 'Symbolic Routing',
    text: 'Every question is routed by topic and strategy so students land in the right solving flow.',
  },
  {
    icon: '✓',
    title: 'Answer Checking',
    text: 'Student submissions return a clear correct or not-correct result without exposing the reference engine.',
  },
  {
    icon: '🔊',
    title: 'Voice Explanations',
    text: 'Solution pages can speak through the walkthrough at a pace that feels comfortable.',
  },
  {
    icon: '📊',
    title: 'Progress Analytics',
    text: 'Students can revisit attempts while teachers see learning signals across the class.',
  },
  {
    icon: '🎯',
    title: 'Teacher Control',
    text: 'Teachers create questions, review performance, and keep practice aligned to the syllabus.',
  },
];

function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page home-detail-page">
      <div className="home-hero-wrap home-detail-hero">
        <div className="home-hero-glow" />
        <div className="home-headline-block">
          <div className="home-hero-badge">
            <span className="home-hero-badge-dot" />
            Platform Capabilities
          </div>
          <p className="home-hl">
            Built&nbsp;<span className="home-blob">⚡</span>&nbsp;for
          </p>
          <p className="home-hl">
            step&nbsp;<span className="home-blob home-blob-wide">by step</span>&nbsp;math
          </p>
          <p className="home-hl home-hl-accent">
            practice!
          </p>
          <p className="home-hero-desc">
            Choose a problem, solve it cleanly, then check. Practice, feedback, voice guidance, and progress — all in one workspace.
          </p>
        </div>

        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost" onClick={() => navigate('/')}>
            <span className="home-pill-icon">←</span>
            <span className="home-pill-btn">Back Home</span>
          </div>
          <div className="home-pill home-pill-solid" onClick={() => navigate('/signup')}>
            <span className="home-pill-icon">→</span>
            <span className="home-pill-btn">Start Free</span>
          </div>
        </div>
      </div>

      <div className="home-features-wrap">
        <div className="home-section-header">
          <span className="home-section-badge">All Features</span>
          <h2 className="home-section-title">Everything you need for<br/><span className="text-gradient">mathematical excellence</span></h2>
        </div>
        <div className="home-features home-features-expanded">
          {featureItems.map((item) => (
            <div className="feature-card" key={item.title}>
              <div className="feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page home-detail-page">
      <div className="home-hero-wrap home-detail-hero">
        <div className="home-hero-glow" />
        <div className="home-headline-block">
          <div className="home-hero-badge">
            <span className="home-hero-badge-dot" />
            About NexStep
          </div>
          <p className="home-hl">
            Math&nbsp;<span className="home-blob">Nx</span>&nbsp;feels
          </p>
          <p className="home-hl">
            clearer&nbsp;<span className="home-blob home-blob-wide">when</span>&nbsp;each
          </p>
          <p className="home-hl home-hl-accent">
            step matters!
          </p>
          <p className="home-hero-desc">
            Made for students who learn by doing. Made for teachers who need clear signals.
          </p>
        </div>

        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost" onClick={() => navigate('/features')}>
            <span className="home-pill-icon">⚡</span>
            <span className="home-pill-btn">See Features</span>
          </div>
          <div className="home-pill home-pill-solid" onClick={() => navigate('/signup')}>
            <span className="home-pill-icon">→</span>
            <span className="home-pill-btn">Join NexStep</span>
          </div>
        </div>
      </div>

      <div className="home-about-section">
        <div className="home-about-band">
          <div>
            <div className="hero-kicker">Our Mission</div>
            <h2>Practice stays focused.<br/>Feedback stays useful.</h2>
            <p>
              NexStep brings problem solving, validation, solution walkthroughs, and performance tracking into one mathematics workspace.
            </p>
          </div>
          <div className="home-about-points">
            <div>
              <span>01</span>
              <p>Students work through problems in a clean editor and get a simple answer check.</p>
            </div>
            <div>
              <span>02</span>
              <p>Solution pages explain the method first, then support voice playback.</p>
            </div>
            <div>
              <span>03</span>
              <p>Teachers keep questions, class progress, and review tools close together.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ user }) {
  const navigate = useNavigate();

  return (
    <div className="page home-page">

      {/* ── Hero ── */}
      <div className="home-hero-wrap">
        <div className="home-hero-glow" />

        {/* Big headline */}
        <div className="home-headline-block">
          <div className="home-hero-badge">
            <span className="home-hero-badge-dot" />
            AI-Powered Mathematics
          </div>
          <p className="home-hl">
            It's&nbsp;<span className="home-blob">⚡</span>&nbsp;time
          </p>
          <p className="home-hl">
            to&nbsp;<span className="home-blob home-blob-wide">→&nbsp;upgrade</span>&nbsp;your
          </p>
          <p className="home-hl home-hl-accent">
            mathematics!
          </p>
          <p className="home-hero-desc">
            Solve your mathematics problems powered by our AI engine. Step-by-step verification, voice walkthroughs, and real-time feedback.
          </p>
        </div>

        {/* Pill CTAs */}
        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost" onClick={() => navigate(user ? (user.role === 'teacher' ? '/teacher' : '/questions') : '/signup')}>
            <span className="home-pill-icon">🗺</span>
            <span className="home-pill-btn">{user ? 'Open Workspace' : 'Get Started Free'}</span>
          </div>
          <div className="home-pill home-pill-solid" onClick={() => navigate(user ? '/questions' : '/login')}>
            <span className="home-pill-icon">⌘</span>
            <span className="home-pill-btn">{user ? 'Enter Studio' : 'Sign In'}</span>
          </div>
        </div>

      </div>

      {/* ── Feature Cards ── */}
      <div className="home-features-wrap" id="features">
        <div className="home-section-header">
          <span className="home-section-badge">Core Capabilities</span>
          <h2 className="home-section-title">Powered by <span className="text-gradient">cutting-edge AI</span></h2>
        </div>
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Neural Parsing</h3>
            <p>Vector calculus, tensor fields, ODEs and complex symbolic expressions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔀</div>
            <h3>Symbolic Routing</h3>
            <p>Automatic strategy selection and step-by-step verification.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Resolution Engine</h3>
            <p>Every derivation verified — mathematically sound and complete.</p>
          </div>
        </div>
      </div>

      {/* ── About ── */}
      <div className="home-about-section">
        <div className="home-about-content">
          <div className="home-section-badge">Why NexStep</div>
          <h2 className="home-section-title" style={{ marginBottom: '16px' }}>Built for serious mathematics.</h2>
          <p className="home-about-text">
            NexStep combines AI-powered symbolic reasoning with step-by-step pedagogy to help students master advanced mathematics.
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="brand-mark" style={{ width: 32, height: 32, fontSize: '0.7rem', borderRadius: 8 }}>Nx</div>
            <span>NexStep</span>
          </div>
          <p>© 2026 NexStep. AI-powered mathematics education platform.</p>
        </div>
      </footer>

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
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/questions'} replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/questions'} replace /> : <SignupPage onLogin={handleLogin} />} />
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
          path="/solution/:id"
          element={(
            <ProtectedRoute user={user} requiredRole="student">
              <SolutionPage />
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
