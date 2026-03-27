import { useEffect, useState } from 'react';
import {
  analyzeQuestion,
  createQuestion,
  deleteQuestion,
  downloadTeacherReport,
  getQuestions,
  getSyllabusMeta,
  getTeacherDashboard,
} from '../api';

const DEFAULT_FORM = {
  title: '',
  problem_expr: '',
  difficulty: '',
  topic: '',
  subject: '',
  unit_name: '',
  problem_type: '',
  concept_tags: [],
  hints: [''],
  allow_copy_paste: true,
};

export default function TeacherDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [syllabusMeta, setSyllabusMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const titleReady = form.title.trim().length >= 4;
    const exprReady = form.problem_expr.trim().length >= 3;
    if (!titleReady || !exprReady) {
      setAnalysis(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      runAnalysis();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [form.title, form.problem_expr, form.topic]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, qs, meta] = await Promise.all([
        getTeacherDashboard(),
        getQuestions(),
        getSyllabusMeta(),
      ]);
      setDashboard(dash);
      setQuestions(qs);
      setSyllabusMeta(meta.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await analyzeQuestion(form);
      setAnalysis(response.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateHint = (index, value) => {
    const nextHints = [...form.hints];
    nextHints[index] = value;
    updateField('hints', nextHints);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      await createQuestion({
        ...form,
        difficulty: form.difficulty || undefined,
        topic: form.topic || undefined,
        subject: form.subject || undefined,
        unit_name: form.unit_name || undefined,
        problem_type: form.problem_type || undefined,
        hints: form.hints.filter((hint) => hint.trim()),
        concept_tags: form.concept_tags,
      });
      setFormSuccess('Question created with premium AI routing.');
      setForm(DEFAULT_FORM);
      setAnalysis(null);
      await loadData();
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
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40 }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <section className="workspace-hero" style={{ padding: '60px', gridTemplateColumns: '1fr 420px', alignItems: 'center' }}>
          <div>
            <div className="hero-kicker">Neural Control Matrix</div>
            <h1 className="hero-title"><span className="text-gradient">AI Orchestration</span><br />& Global Sync.</h1>
            <p className="hero-subtitle">Monitor neural parsing, classification, and student telemetry in real-time across all curriculum nodes.</p>
            <div style={{ marginTop: '40px' }}>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await downloadTeacherReport();
                  } catch {
                    alert('Failed to download CSV report.');
                  }
                }}
              >
                Snapshot Full Dataset (CSV)
              </button>
            </div>
          </div>
          
          <div className="card" style={{ padding: '32px', background: 'rgba(0,0,0,0.4)', borderColor: 'var(--accent-secondary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>QUESTIONS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{dashboard?.overview.total_questions || 0}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ACCURACY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{dashboard?.overview.overall_accuracy || 0}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>THROUGHPUT</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{dashboard?.overview.total_submissions || 0}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>VALIDATION</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-success)' }}>ACTIVE</div>
              </div>
            </div>
          </div>
        </section>

        <div className="tab-strip" style={{ marginBottom: '40px' }}>
          {[
            ['dashboard', 'Analytics Layer'],
            ['create', 'Curriculum Builder'],
            ['questions', 'Question Bank'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab-pill ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && dashboard && (
          <div className="fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value text-gradient">{dashboard.overview.total_questions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.total_submissions}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-gradient">{dashboard.overview.total_correct}</div>
                <div className="stat-label">Correct Solutions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.overview.overall_accuracy}%</div>
                <div className="stat-label">Global Accuracy</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
              <main>
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-main)' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>Student Network Status</h3>
                  </div>
                  <div style={{ padding: '32px 40px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Identity</th>
                          <th>Throughput</th>
                          <th>Valid</th>
                          <th>Accuracy</th>
                          <th>Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.student_stats.map((student) => (
                          <tr key={student.id}>
                            <td style={{ fontWeight: 700 }}>{student.username}</td>
                            <td style={{ fontFamily: 'JetBrains Mono' }}>{student.total_submissions}</td>
                            <td style={{ color: 'var(--accent-success)', fontWeight: 700 }}>{student.correct_submissions}</td>
                            <td style={{ fontWeight: 700 }}>{student.accuracy}%</td>
                            <td style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{student.avg_score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </main>

              <aside>
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-main)' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>Live Transmission</h3>
                  </div>
                  <div style={{ padding: '32px 40px' }} className="scroll-column">
                    {dashboard.recent_submissions.slice(0, 15).map((submission) => (
                      <div key={submission.id} className="stat-card" style={{ padding: '24px', margin: '0 0 20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{submission.student}</div>
                          <div className="soft-pill">{Math.round(submission.score)}%</div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {submission.question}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className="builder-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '40px' }}>
            <div className="card" style={{ padding: '40px' }}>
              <div className="hero-kicker" style={{ fontSize: '0.65rem' }}>Question Assembly</div>
              <h3 className="card-title" style={{ marginBottom: '32px' }}>Curriculum Builder</h3>
              <form onSubmit={handleCreateQuestion}>
                {formError && <div className="badge badge-hard" style={{ width: '100%', marginBottom: '24px', padding: '12px', textAlign: 'center' }}>{formError}</div>}
                {formSuccess && <div className="badge badge-solved" style={{ width: '100%', marginBottom: '24px', padding: '12px', textAlign: 'center' }}>{formSuccess}</div>}

                <div className="form-group">
                  <label>Curriculum Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter question context..."
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '24px' }}>
                  <label>Raw Expression (Sympy Compatible)</label>
                  <textarea
                    value={form.problem_expr}
                    onChange={(e) => updateField('problem_expr', e.target.value)}
                    placeholder="e.g. solve(x**2 - 4, x)"
                    required
                    rows={5}
                    style={{ fontFamily: "'JetBrains Mono', monospace", border: '1px solid var(--accent-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                  <div className="form-group">
                    <label>Intelligence Topic</label>
                    <input
                      value={form.topic}
                      onChange={(e) => updateField('topic', e.target.value)}
                      placeholder="Auto"
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty Threshold</label>
                    <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
                      <option value="">Neural Analysis (Auto)</option>
                      <option value="easy">Level 1 (Easy)</option>
                      <option value="medium">Level 2 (Medium)</option>
                      <option value="hard">Level 3 (Hard)</option>
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: '40px', justifyContent: 'center' }} type="submit" disabled={submitting}>
                  {submitting ? <div className="spinner"></div> : 'Publish to Curriculum Node'}
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gap: '24px', alignContent: 'start' }}>
              <div className="card" style={{ padding: '32px', background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div className="hero-kicker" style={{ fontSize: '0.65rem', margin: 0 }}>AI Routing Preview</div>
                  <div className={`badge ${analyzing ? 'badge-medium' : 'badge-solved'}`} style={{ fontSize: '0.6rem' }}>{analyzing ? 'Processing' : 'Active'}</div>
                </div>
                {analysis ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="stat-card" style={{ padding: '20px', margin: 0 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>STRATEGY</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{analysis.strategy}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '20px', margin: 0 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>CONFIDENCE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{Math.round((analysis.confidence || 0) * 100)}%</div>
                    </div>
                    <div className="chip-wrap">
                      {(analysis.concept_tags || []).map((tag) => <span className="badge badge-easy" key={tag} style={{ fontSize: '0.6rem' }}>{tag}</span>)}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Awaiting curriculum data for mapping analysis...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="fade-in">
            {questions.length === 0 ? (
              <div className="card empty-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '20px' }}>∫</div>
                <h3>Question Node Offline</h3>
                <p>No curricula entries found in this department node.</p>
              </div>
            ) : (
              <div className="questions-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {questions.map((question, index) => (
                  <div key={question.id} className="card" style={{ padding: '32px', transition: 'all 0.3s', animationDelay: `${index * 0.05}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{question.title}</h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{question.subject} · {question.topic}</div>
                      </div>
                      <div className={`badge badge-${question.difficulty}`}>{question.difficulty}</div>
                    </div>
                    <div className="problem">{question.problem_expr}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', borderTop: '1px solid var(--border-main)', paddingTop: '24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {question.id.slice(0, 8)}...</div>
                      <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }} onClick={() => handleDelete(question.id)}>Purge</button>
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
