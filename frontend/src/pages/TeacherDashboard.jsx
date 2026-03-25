import { useState, useEffect } from 'react';
import { createQuestion, getQuestions, deleteQuestion, getTeacherDashboard } from '../api';

export default function TeacherDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [problemExpr, setProblemExpr] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [hints, setHints] = useState(['']);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, qs] = await Promise.all([
        getTeacherDashboard(),
        getQuestions()
      ]);
      setDashboard(dash);
      setQuestions(qs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      await createQuestion({
        title,
        problem_expr: problemExpr,
        difficulty,
        hints: hints.filter((h) => h.trim()),
      });
      setFormSuccess('Question created successfully!');
      setTitle('');
      setProblemExpr('');
      setDifficulty('medium');
      setHints(['']);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qid) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(qid);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Teacher Dashboard</h1>
          <p>Manage questions and track student progress</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          {[
            { key: 'dashboard', label: '📊 Analytics' },
            { key: 'create', label: '➕ Create Question' },
            { key: 'questions', label: '📋 Questions' },
          ].map((t) => (
            <button
              key={t.key}
              className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && dashboard && (
          <div className="fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.total_questions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.total_submissions}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.total_correct}</div>
                <div className="stat-label">Correct Solutions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.overall_accuracy}%</div>
                <div className="stat-label">Overall Accuracy</div>
              </div>
            </div>

            {/* Student Performance */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">📈 Student Performance</h3>
              </div>
              {dashboard.student_stats.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No students yet</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Submissions</th>
                        <th>Correct</th>
                        <th>Accuracy</th>
                        <th>Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.student_stats.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.username}</td>
                          <td>{s.email}</td>
                          <td>{s.total_submissions}</td>
                          <td>{s.correct_submissions}</td>
                          <td>
                            <span style={{ color: s.accuracy < 50 ? 'var(--accent-error)' : s.accuracy < 75 ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 600 }}>
                              {s.accuracy}%
                            </span>
                          </td>
                          <td>{s.avg_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🕐 Recent Submissions</h3>
              </div>
              {dashboard.recent_submissions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Question</th>
                        <th>Result</th>
                        <th>Score</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent_submissions.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 500 }}>{s.student}</td>
                          <td>{s.question}</td>
                          <td>
                            <span className={`badge ${s.is_correct ? 'badge-easy' : 'badge-hard'}`}>
                              {s.is_correct ? '✅ Correct' : '❌ Incorrect'}
                            </span>
                          </td>
                          <td>{Math.round(s.score)}%</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Question Tab */}
        {tab === 'create' && (
          <div className="fade-in">
            <div className="card">
              <form className="create-form" onSubmit={handleCreateQuestion}>
                {formError && <div className="auth-error">{formError}</div>}
                {formSuccess && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    {formSuccess}
                  </div>
                )}
                <div className="form-group">
                  <label>Question Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Basic Power Rule" required />
                </div>
                <div className="form-group">
                  <label>Integrand Expression (what's inside ∫ ... dx)</label>
                  <input value={problemExpr} onChange={(e) => setProblemExpr(e.target.value)} placeholder="e.g. x^2, sin(x), 3*x^2 + 2*x" required style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Use ^ for exponents, * for multiplication. Examples: x^2, sin(x), exp(x), 1/x
                  </small>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button key={d} type="button" className={`btn btn-sm ${difficulty === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDifficulty(d)}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Hints (optional)</label>
                  <div className="hints-list">
                    {hints.map((h, i) => (
                      <div key={i} className="hint-row">
                        <input value={h} onChange={(e) => {
                          const newHints = [...hints];
                          newHints[i] = e.target.value;
                          setHints(newHints);
                        }} placeholder={`Hint ${i + 1}`} />
                        {hints.length > 1 && (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => setHints(hints.filter((_, j) => j !== i))}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setHints([...hints, ''])} style={{ alignSelf: 'flex-start' }}>
                      + Add Hint
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                  {submitting ? <><div className="spinner"></div> Creating...</> : 'Create Question'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {tab === 'questions' && (
          <div className="fade-in">
            {questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No questions created yet</h3>
                <button className="btn btn-primary" onClick={() => setTab('create')}>Create Your First Question</button>
              </div>
            ) : (
              <div className="questions-grid">
                {questions.map((q, i) => (
                  <div key={q.id} className="question-card" style={{ animationDelay: `${i * 0.08}s` }}>
                    <h3>{q.title}</h3>
                    <div className="problem">∫ {q.problem_expr} dx</div>
                    <div className="meta">
                      <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q.id)}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
