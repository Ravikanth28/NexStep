import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions } from '../api';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(filter);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Practice Problems</h1>
          <p>Choose an integral to solve step by step</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${filter === d ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(d)}
            >
              {d === '' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">∫</div>
            <h3>No questions available</h3>
            <p>Ask your teacher to create some integral problems!</p>
          </div>
        ) : (
          <div className="questions-grid">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="question-card"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => navigate(`/solve/${q.id}`)}
              >
                <h3>{q.title}</h3>
                <div className="problem">∫ {q.problem_expr} dx</div>
                <div className="meta">
                  <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                  <span>by {q.created_by}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
