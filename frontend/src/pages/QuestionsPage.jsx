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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, [difficulty, topic]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(difficulty, topic);
      setQuestions(data);
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
    <div className="page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <section className="workspace-hero" style={{ padding: '60px', gridTemplateColumns: '1fr 380px' }}>
          <div>
            <div className="hero-kicker">Practice Observatory</div>
            <h1 className="hero-title"><span className="text-gradient">Data-Driven</span><br />Mathematics.</h1>
            <p className="hero-subtitle">Interactive symbolic environments with real-time neural validation and automated strategy execution.</p>
          </div>
          
          <div className="card" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--accent-primary)', padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ACTIVE NODES</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{visibleQuestions.length}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ROUTING CONF</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>{routedAverage}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ENGINE MODE</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>AI SYMPY</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>DOMAIN FOCUS</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{topic}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="question-browser" style={{ gridTemplateColumns: '280px 1fr' }}>
          <aside>
            <div className="card" style={{ padding: '32px', position: 'sticky', top: '120px' }}>
              <div className="hero-kicker" style={{ fontSize: '0.65rem', marginBottom: '16px' }}>Filter Constellation</div>
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
                      background: topic === item ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
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
                  style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '16px 24px' }}
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
              <div className="empty-state">
                <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40, borderWidth: '4px' }}></div>
              </div>
            ) : visibleQuestions.length === 0 ? (
              <div className="card empty-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '20px' }}>∫</div>
                <h3>No queries found.</h3>
                <p>Try re-configuring your filters or search terms.</p>
              </div>
            ) : (
              <div className="questions-grid">
                {visibleQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    className="question-card"
                    style={{ 
                      animationDelay: `${index * 0.05}s`,
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

                      <div className="chip-wrap" style={{ marginTop: '24px' }}>
                        <div className="soft-pill">{question.topic}</div>
                        <div className="soft-pill">{question.unit_name}</div>
                        <div className="soft-pill" style={{ color: 'var(--accent-primary)' }}>{Math.round((question.analysis_confidence || 0) * 100)}% Routed</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
