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

  return (
    <nav className={`navbar ${useHomeNav ? 'navbar-home' : ''}`}>
      <Link to="/" className="navbar-brand">
        <div className="brand-mark">Nx</div>
        <div className="brand-info">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>NexStep</div>
        </div>
      </Link>

      {useHomeNav && !user && (
        <div className="navbar-pill-nav">
          <button className={`nav-pill-link ${isHome ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/')}>Home</button>
          <button className={`nav-pill-link ${isFeaturePage ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/features')}>Features</button>
          <button className={`nav-pill-link ${isAboutPage ? 'nav-pill-link-active' : ''}`} onClick={() => navigate('/about')}>About</button>
        </div>
      )}

      <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {user ? (
          <>
            <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>Workspace</Link>
            {user.role === 'student' && (
              <Link to="/progress" className={`nav-link ${isActive('/progress') ? 'active' : ''}`}>Analytics</Link>
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

const featureItems = [
  {
    icon: 'AI',
    title: 'Neural Parsing',
    text: 'Vector calculus, tensor fields, ODEs, transforms, and symbolic expressions stay readable from the first step.',
  },
  {
    icon: 'RT',
    title: 'Symbolic Routing',
    text: 'Every question is routed by topic and strategy so students land in the right solving flow.',
  },
  {
    icon: 'OK',
    title: 'Answer Checking',
    text: 'Student submissions return a clear correct or not-correct result without exposing the reference engine.',
  },
  {
    icon: 'VO',
    title: 'Voice Explanations',
    text: 'Solution pages can speak through the walkthrough at a pace that feels comfortable.',
  },
  {
    icon: 'PR',
    title: 'Progress Analytics',
    text: 'Students can revisit attempts while teachers see learning signals across the class.',
  },
  {
    icon: 'TC',
    title: 'Teacher Control',
    text: 'Teachers create questions, review performance, and keep practice aligned to the syllabus.',
  },
];

function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page home-detail-page">
      <div className="home-hero-wrap home-detail-hero">
        <div className="home-ann home-ann-bl">
          <p>Choose a problem,<br />solve it cleanly,<br />then check.</p>
        </div>
        <div className="home-ann home-ann-tr">
          <p>Practice, feedback,<br />voice guidance,<br />and progress.</p>
        </div>

        <div className="home-headline-block">
          <p className="home-hl">
            Built&nbsp;<span className="home-blob">AI</span>&nbsp;for
          </p>
          <p className="home-hl">
            step&nbsp;<span className="home-blob home-blob-wide">by step</span>&nbsp;math
          </p>
          <p className="home-hl home-hl-accent">
            practice!
          </p>
        </div>

        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost">
            <span className="home-pill-nav">&lt;&lt;</span>
            <button className="home-pill-btn" onClick={() => navigate('/')}>Back Home</button>
            <span className="home-pill-icon">Nx</span>
          </div>
          <div className="home-pill home-pill-solid">
            <span className="home-pill-icon">Go</span>
            <button className="home-pill-btn" onClick={() => navigate('/signup')}>Start Free</button>
            <span className="home-pill-nav">&gt;&gt;</span>
          </div>
        </div>
      </div>

      <div className="home-features-wrap">
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
        <div className="home-ann home-ann-bl">
          <p>Made for students<br />who learn by<br />doing.</p>
        </div>
        <div className="home-ann home-ann-tr">
          <p>Made for teachers<br />who need clear<br />signals.</p>
        </div>

        <div className="home-headline-block">
          <p className="home-hl">
            Math&nbsp;<span className="home-blob">Nx</span>&nbsp;feels
          </p>
          <p className="home-hl">
            clearer&nbsp;<span className="home-blob home-blob-wide">when</span>&nbsp;each
          </p>
          <p className="home-hl home-hl-accent">
            step matters!
          </p>
        </div>

        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost">
            <span className="home-pill-nav">&lt;&lt;</span>
            <button className="home-pill-btn" onClick={() => navigate('/features')}>See Features</button>
            <span className="home-pill-icon">AI</span>
          </div>
          <div className="home-pill home-pill-solid">
            <span className="home-pill-icon">Go</span>
            <button className="home-pill-btn" onClick={() => navigate('/signup')}>Join NexStep</button>
            <span className="home-pill-nav">&gt;&gt;</span>
          </div>
        </div>
      </div>

      <div className="home-about-band">
        <div>
          <div className="hero-kicker">About NexStep</div>
          <h2>Practice stays focused. Feedback stays useful.</h2>
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
  );
}

function HomePage({ user }) {
  const navigate = useNavigate();

  return (
    <div className="page home-page">

      {/* ── Hero ── */}
      <div className="home-hero-wrap">

        {/* Floating annotations */}
        <div className="home-ann home-ann-bl">
          <p>If you don't know where<br />to start, try the guided<br />tour first.</p>
        </div>
        <div className="home-ann home-ann-tr">
          <p>Solve your mathematics<br />problems powered<br />by our AI engine.</p>
        </div>

        {/* Big headline */}
        <div className="home-headline-block">
          <p className="home-hl">
            It's&nbsp;<span className="home-blob">⚡</span>&nbsp;time
          </p>
          <p className="home-hl">
            to&nbsp;<span className="home-blob home-blob-wide">→&nbsp;upgrade</span>&nbsp;your
          </p>
          <p className="home-hl home-hl-accent">
            mathematics!
          </p>
        </div>

        {/* Pill CTAs */}
        <div className="home-pill-ctas">
          <div className="home-pill home-pill-ghost">
            <span className="home-pill-nav">‹‹</span>
            <button
              className="home-pill-btn"
              onClick={() => navigate(user ? (user.role === 'teacher' ? '/teacher' : '/questions') : '/signup')}
            >
              {user ? 'Open Workspace' : 'Get Started Free'}
            </button>
            <span className="home-pill-icon">🗺</span>
          </div>
          <div className="home-pill home-pill-solid">
            <span className="home-pill-icon">⌘</span>
            <button
              className="home-pill-btn"
              onClick={() => navigate(user ? '/questions' : '/login')}
            >
              {user ? 'Enter Studio' : 'Sign In'}
            </button>
            <span className="home-pill-nav">&gt;&gt;</span>
          </div>
        </div>

      </div>

      {/* ── Feature Cards ── */}
      <div className="home-features-wrap" id="features">
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
      <div id="about" style={{ padding: '48px 80px 72px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.40)' }}>
        <p style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0a1628', marginBottom: '14px' }}>Built for serious mathematics.</p>
        <p style={{ color: '#1e3a5a', fontSize: '1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.85 }}>
          NexStep combines AI-powered symbolic reasoning with step-by-step pedagogy to help students master advanced mathematics.
        </p>
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
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
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
