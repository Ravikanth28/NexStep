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

  return (
    <div className="page">
      <div className="container">
        <div className="workspace-hero student-hero">
          <div>
            <div className="hero-kicker">Student Practice Hub</div>
            <h1>Train across the full engineering mathematics syllabus</h1>
            <p>
              Browse dynamically mapped questions, open any problem, and validate your full step-by-step working
              inside a math-aware editor.
            </p>
          </div>
        </div>

        <div className="question-browser">
          <aside className="card question-sidebar">
            <h3>Syllabus Topics</h3>
            <div className="sidebar-topic-list">
              {SYLLABUS_TOPICS.map((item) => (
                <button
                  key={item}
                  className={`sidebar-topic-btn ${topic === item ? 'active' : ''}`}
                  onClick={() => setTopic(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <main className="question-main">
            <div className="question-toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, topic, unit, or expression"
              />
              <div className="chip-wrap">
                {['', 'easy', 'medium', 'hard'].map((value) => (
                  <button
                    key={value || 'any'}
                    className={`tab-pill ${difficulty === value ? 'active' : ''}`}
                    onClick={() => setDifficulty(value)}
                    type="button"
                  >
                    {value || 'Any Difficulty'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
              </div>
            ) : visibleQuestions.length === 0 ? (
              <div className="card empty-state">
                <h3>No questions found</h3>
                <p>Try another syllabus topic or search term.</p>
              </div>
            ) : (
              <div className="questions-grid">
                {visibleQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    className="question-card syllabus-card align-left"
                    style={{ animationDelay: `${index * 0.07}s` }}
                    onClick={() => navigate(`/solve/${question.id}`)}
                    type="button"
                  >
                    <div className="question-card-top">
                      <div>
                        <h3>{question.title}</h3>
                        <p className="question-subline">{question.subject}</p>
                      </div>
                      <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
                    </div>
                    <div className="problem">{question.problem_expr}</div>
                    <div className="chip-wrap">
                      <span className="soft-pill">{question.topic}</span>
                      <span className="soft-pill">{question.unit_name}</span>
                      <span className="soft-pill">{question.validation_strategy}</span>
                    </div>
                    <div className="meta" style={{ marginTop: '18px' }}>
                      <span>by {question.created_by}</span>
                      <span>{Math.round((question.analysis_confidence || 0) * 100)}% routed</span>
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
