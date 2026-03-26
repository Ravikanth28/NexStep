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
      setFormSuccess('Question created with dynamic syllabus mapping.');
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
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="workspace-hero teacher-hero">
          <div>
            <div className="hero-kicker">Teacher Control Room</div>
            <h1>Build dynamic math assessments with syllabus-aware routing</h1>
            <p>
              Enter a raw engineering mathematics problem and the platform will infer the likely unit,
              topic family, difficulty, and validation strategy before students solve it.
            </p>
          </div>
          <div className="hero-actions">
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
              Download CSV Report
            </button>
          </div>
        </div>

        <div className="tab-strip">
          {[
            ['dashboard', 'Analytics'],
            ['create', 'Dynamic Builder'],
            ['questions', 'Question Bank'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab-pill ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

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

            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">Student Performance</h3>
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
                      {dashboard.student_stats.map((student) => (
                        <tr key={student.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.username}</td>
                          <td>{student.email}</td>
                          <td>{student.total_submissions}</td>
                          <td>{student.correct_submissions}</td>
                          <td>{student.accuracy}%</td>
                          <td>{student.avg_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Submissions</h3>
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
                      {dashboard.recent_submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>{submission.student}</td>
                          <td>{submission.question}</td>
                          <td>{submission.is_correct ? 'Correct' : 'Incorrect'}</td>
                          <td>{Math.round(submission.score)}%</td>
                          <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className="builder-grid fade-in">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Question Builder</h3>
              </div>
              <form className="create-form" onSubmit={handleCreateQuestion}>
                {formError && <div className="auth-error">{formError}</div>}
                {formSuccess && <div className="success-banner">{formSuccess}</div>}

                <div className="form-group">
                  <label>Question Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Example: Solve using Laplace transform"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Raw Question / Expression</label>
                  <textarea
                    value={form.problem_expr}
                    onChange={(e) => updateField('problem_expr', e.target.value)}
                    placeholder="Example: laplace_transform(exp(3*x), x, s)[0]"
                    required
                    rows={5}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Teacher Topic Override</label>
                    <input
                      value={form.topic}
                      onChange={(e) => updateField('topic', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty Override</label>
                    <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
                      <option value="">Auto detect</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Subject Override</label>
                    <input
                      value={form.subject}
                      onChange={(e) => updateField('subject', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Override</label>
                    <input
                      value={form.unit_name}
                      onChange={(e) => updateField('unit_name', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Validation Strategy Override</label>
                  <select value={form.problem_type} onChange={(e) => updateField('problem_type', e.target.value)}>
                    <option value="">Auto detect</option>
                    <option value="integral">Integral</option>
                    <option value="matrix">Matrix</option>
                    <option value="transform">Transform</option>
                    <option value="vector">Vector</option>
                    <option value="stats">Statistics / Probability</option>
                    <option value="ode">Differential Equation</option>
                    <option value="general">General / Fallback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.allow_copy_paste}
                      onChange={(e) => updateField('allow_copy_paste', e.target.checked)}
                      style={{ width: 'auto', marginBottom: 0 }}
                    />
                    <span>Allow copy and paste in the student editor</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Hints</label>
                  <div className="hints-list">
                    {form.hints.map((hint, index) => (
                      <div key={index} className="hint-row">
                        <input
                          value={hint}
                          onChange={(e) => updateHint(index, e.target.value)}
                          placeholder={`Hint ${index + 1}`}
                        />
                        {form.hints.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => updateField('hints', form.hints.filter((_, i) => i !== index))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => updateField('hints', [...form.hints, ''])}
                    >
                      Add Hint
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                  {submitting ? <><div className="spinner"></div> Publishing...</> : 'Create Question'}
                </button>
              </form>
            </div>

            <div className="analysis-stack">
              <div className="card analysis-card">
                <div className="card-header">
                  <h3 className="card-title">Dynamic Mapping Preview</h3>
                  <span className="soft-pill">{analyzing ? 'Analyzing' : 'Live'}</span>
                </div>
                {analysis ? (
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <span className="analysis-label">Subject</span>
                      <strong>{analysis.subject}</strong>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Topic</span>
                      <strong>{analysis.topic}</strong>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Unit</span>
                      <strong>{analysis.unit_name}</strong>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Strategy</span>
                      <strong>{analysis.strategy}</strong>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Difficulty</span>
                      <strong>{analysis.difficulty}</strong>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Confidence</span>
                      <strong>{Math.round((analysis.confidence || 0) * 100)}%</strong>
                    </div>
                    <div className="analysis-item analysis-tags">
                      <span className="analysis-label">Concept Tags</span>
                      <div className="chip-wrap">
                        {(analysis.concept_tags || []).length > 0 ? (
                          analysis.concept_tags.map((tag) => <span className="soft-pill" key={tag}>{tag}</span>)
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No keyword matches yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>
                    Start typing a question title and expression to preview the detected syllabus mapping.
                  </p>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Syllabus Coverage</h3>
                </div>
                <div className="syllabus-mini-list">
                  {syllabusMeta.slice(0, 8).map((entry, index) => (
                    <div key={`${entry.topic}-${index}`} className="syllabus-mini-item">
                      <div>
                        <strong>{entry.topic}</strong>
                        <p>{entry.subject}</p>
                      </div>
                      <span className="soft-pill">{entry.strategy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="fade-in">
            {questions.length === 0 ? (
              <div className="empty-state">
                <h3>No questions created yet</h3>
              </div>
            ) : (
              <div className="questions-grid">
                {questions.map((question, index) => (
                  <div key={question.id} className="question-card syllabus-card" style={{ animationDelay: `${index * 0.07}s` }}>
                    <div className="question-card-top">
                      <div>
                        <h3>{question.title}</h3>
                        <p className="question-subline">{question.subject} · {question.topic}</p>
                      </div>
                      <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
                    </div>
                    <div className="problem">{question.problem_expr}</div>
                    <div className="chip-wrap">
                      <span className="soft-pill">{question.validation_strategy}</span>
                      <span className="soft-pill">{question.unit_name}</span>
                      <span className="soft-pill">{Math.round((question.analysis_confidence || 0) * 100)}% match</span>
                    </div>
                    <div className="meta" style={{ marginTop: '18px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>by {question.created_by}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(question.id)}>
                        Delete
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
