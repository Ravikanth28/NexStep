import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions } from '../api';

const SYLLABUS_TOPICS = [
  'All',
  'Calculus',
  'Matrices',
  'Differential Equations',
  'Vector Calculus',
  'Transforms',
  'Probability & Stats'
];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [topic, setTopic] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, [filter, topic]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(filter, topic);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Sidebar Navigation */}
        <aside className="card" style={{ padding: '24px', flex: '0 0 280px', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Syllabus Units
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SYLLABUS_TOPICS.map((t) => (
              <li key={t}>
                <button
                  className={`btn ${topic === t ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', border: topic !== t ? 'none' : '' }}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <h1>Practice Problems</h1>
            <p>Select a mathematical problem from the syllabus to compute</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {['', 'easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${filter === d ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '999px' }}
                onClick={() => setFilter(d)}
              >
                {d === '' ? 'Any Difficulty' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon" style={{ fontSize: '3rem' }}>∑</div>
              <h3>No questions found</h3>
              <p>There are currently no problems available for {topic}. Check back later!</p>
            </div>
          ) : (
            <div className="questions-grid">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="card question-card"
                  style={{ animationDelay: `${i * 0.08}s`, padding: '24px', cursor: 'pointer' }}
                  onClick={() => navigate(`/solve/${q.id}`)}
                >
                  <h3 style={{ marginBottom: '12px' }}>{q.title}</h3>
                  <div className="problem" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', marginBottom: '16px', color: 'var(--accent-primary-hover)' }}>
                    {q.problem_expr}
                  </div>
                  <div className="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>by {q.created_by}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
