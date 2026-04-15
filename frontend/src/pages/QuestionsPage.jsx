import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions } from '../api';

const SYLLABUS_TOPICS = [
  'All',
  'Matrices',
  'Differential Equations',
  'Functions of Several Variables',
  'Multiple Integrals',
  'Vector Calculus',
  'Fourier Series',
  'Fourier Transforms',
  'Laplace Transforms',
  'Inverse Laplace Transforms',
  'Z-Transforms',
  'Probability',
  'Random Variables',
  'Design of Experiments',
  'Hypothesis Testing',
];

const PAGE_SIZE = 20;

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '65%', height: '18px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '40%', height: '12px' }} />
        </div>
        <div className="skeleton" style={{ width: '64px', height: '28px', borderRadius: '999px', marginLeft: '12px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '60px', marginTop: '20px', borderRadius: '12px' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: '110px', height: '28px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: '75px', height: '28px', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}>
        <div className="skeleton" style={{ height: '38px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '38px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    setPage(1);
  }, [difficulty, topic]);

  useEffect(() => {
    loadQuestions();
  }, [difficulty, topic, page]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(difficulty, topic, page, PAGE_SIZE);
      setQuestions(data.questions);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((question) =>
      [question.title, question.problem_expr, question.subject, question.topic, question.unit_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [questions, search]);

  const routedAverage = visibleQuestions.length
    ? Math.round(
        visibleQuestions.reduce((sum, question) => sum + Math.round((question.analysis_confidence || 0) * 100), 0) /
          visibleQuestions.length,
      )
    : 0;

  return (
    <div className="page student-page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <section className="workspace-hero" style={{ padding: '44px 60px', gridTemplateColumns: '1fr 380px' }}>
          <div>
            <div className="hero-kicker">Practice</div>
            <h1 className="hero-title"><span className="text-gradient">Mathematics</span><br />Questions.</h1>
            <p className="hero-subtitle">Browse and solve questions across all topics. AI checks your steps in real time.</p>
          </div>
          
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Questions</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{total}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Avg. Confidence</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>{routedAverage}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Engine</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>AI SymPy</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Topic</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2e3cb5' }}>{topic}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="question-browser" style={{ gridTemplateColumns: '280px 1fr' }}>
          <aside>
            <div className="card" style={{ padding: '32px', position: 'sticky', top: '120px' }}>
              <div className="hero-kicker" style={{ fontSize: '0.65rem', marginBottom: '16px' }}>Filter by Topic</div>
              <h3 style={{ marginBottom: '24px' }}>Syllabus Domain</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SYLLABUS_TOPICS.map((item) => (
                  <button
                    key={item}
                    className={`nav-link ${topic === item ? 'active' : ''}`}
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      borderRadius: '8px',
                      background: topic === item ? 'rgba(46,60,181,0.08)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                    onClick={() => setTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, expression, or topic..."
                  style={{ borderRadius: '12px', padding: '16px 24px' }}
                />
                <div className="tab-strip" style={{ margin: 0 }}>
                  {['', 'easy', 'medium', 'hard'].map((value) => (
                    <button
                      key={value || 'any'}
                      className={`tab-pill ${difficulty === value ? 'active' : ''}`}
                      onClick={() => setDifficulty(value)}
                    >
                      {value || 'Any Difficulty'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="questions-grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : visibleQuestions.length === 0 ? (
              <div className="card empty-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '20px' }}>∫</div>
                <h3>No queries found.</h3>
                <p>Try re-configuring your filters or search terms.</p>
              </div>
            ) : (
              <>
              <div className="questions-grid">
                {visibleQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="question-card"
                    style={{ 
                      animationDelay: `${index * 0.04}s`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                      all: 'unset',
                      display: 'block',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => navigate(`/solve/${question.id}`)}
                  >
                    <div className="card" style={{ padding: '32px', cursor: 'pointer', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{question.title}</h3>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{question.subject}</div>
                        </div>
                        <div className={`badge badge-${question.difficulty || 'medium'}`}>{question.difficulty}</div>
                      </div>
                      
                      <div className="problem">
                        {question.problem_expr}
                      </div>
                      {question.problem_image && (
                        <img
                          src={question.problem_image}
                          alt="Expression"
                          style={{ marginTop: '12px', maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-main)', objectFit: 'contain', display: 'block' }}
                        />
                      )}

                      <div className="chip-wrap" style={{ marginTop: '24px' }}>
                        <div className="soft-pill">{question.topic}</div>
                        <div className="soft-pill">{question.unit_name}</div>
                        <div className="soft-pill" style={{ color: 'var(--accent-primary)' }}>{Math.round((question.analysis_confidence || 0) * 100)}% Routed</div>
                      </div>

                      {user?.role === 'student' && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}
                        >
                          <button
                            className="btn btn-primary"
                            style={{ justifyContent: 'center', padding: '10px 14px', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/solve/${question.id}`)}
                          >
                            Solve
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ justifyContent: 'center', padding: '10px 14px', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/solution/${question.id}`)}
                          >
                            See Solution
                          </button>
                        </div>
                      )}

                      {user?.role === 'teacher' && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}
                        >
                          <button
                            className="btn btn-primary"
                            style={{ justifyContent: 'center', padding: '10px 14px', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/solve/${question.id}`)}
                          >
                            Solve
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ justifyContent: 'center', padding: '10px 14px', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/solution/${question.id}`)}
                          >
                            See Solution
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
                        )}
                        <button
                          className={`tab-pill ${page === p ? 'active' : ''}`}
                          style={{ minWidth: '44px', justifyContent: 'center', padding: '10px 16px' }}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))
                  }
                  <button
                    className="btn btn-outline"
                    style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
