import { useEffect, useRef, useState } from 'react';
import 'mathlive';
import MathKeyboard from '../components/MathKeyboard';
import {
  analyzeQuestion,
  createQuestion,
  deleteQuestion,
  downloadTeacherReport,
  getQuestionAnswer,
  getQuestions,
  getSyllabusMeta,
  getTeacherDashboard,
  parseExpressionImage,
} from '../api';

const BUILDER_LIBRARY = [
  { id: 'task_fourier', label: 'Find the Fourier Series of', value: 'Find the Fourier Series of' },
  { id: 'task_laplace', label: 'Find the Laplace Transform of', value: 'Find the Laplace Transform of' },
  { id: 'task_inverse_laplace', label: 'Find the Inverse Laplace Transform of', value: 'Find the Inverse Laplace Transform of' },
  { id: 'fx', label: 'f(x)=', value: 'f(x)=' },
  { id: 'expr_x2', label: 'x**2', value: 'x**2' },
  { id: 'expr_sinx', label: 'sin(x)', value: 'sin(x)' },
  { id: 'expr_cosx', label: 'cos(x)', value: 'cos(x)' },
  { id: 'expr_expx', label: 'exp(x)', value: 'exp(x)' },
  { id: 'interval_pi', label: 'on (-pi, pi)', value: 'on (-pi, pi)' },
  { id: 'interval_half_pi', label: 'on (0, pi)', value: 'on (0, pi)' },
  { id: 'note_even', label: 'where f(-x)=f(x)', value: 'where f(-x)=f(x)' },
  { id: 'note_odd', label: 'where f(-x)=-f(x)', value: 'where f(-x)=-f(x)' },
];

const DEFAULT_FORM = {
  title: '',
  problem_expr: '',
  problem_image: null,
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
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [loadingAnswer, setLoadingAnswer] = useState(null);
  const [builderItems, setBuilderItems] = useState([]);
  const [customBuilderToken, setCustomBuilderToken] = useState('');
  const [imageParseLoading, setImageParseLoading] = useState(false);
  const imageInputRef = useRef(null);
  const mathFieldRef = useRef(null);
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    if (mf.getValue('latex') !== form.problem_expr) {
      mf.setValue(form.problem_expr, { suppressChangeNotifications: true });
    }
  }, [form.problem_expr]);

  // Wire math-field input → form state once on mount
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    const handleInput = () => {
      const val = mf.getValue('latex');
      setForm((current) => ({ ...current, problem_expr: val }));
    };
    mf.addEventListener('input', handleInput);
    return () => mf.removeEventListener('input', handleInput);
  }, []);

  const handleInsertSymbol = (latex) => {
    const mf = mathFieldRef.current;
    if (mf) {
      mf.insert(latex);
      setForm((current) => ({ ...current, problem_expr: mf.getValue('latex') }));
    }
  };

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

  const syncProblemExpr = (nextBuilderItems) => {
    const builderExpr = nextBuilderItems.map((item) => item.value).join(' ').replace(/\s+/g, ' ').trim();
    setBuilderItems(nextBuilderItems);
    setForm((current) => ({
      ...current,
      problem_expr: builderExpr || current.problem_expr,
    }));
  };

  const handleDragStart = (event, block) => {
    event.dataTransfer.setData('application/json', JSON.stringify(block));
  };

  const handleDropToken = (event) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/json');
    if (!payload) return;
    const block = JSON.parse(payload);
    const nextBuilderItems = [
      ...builderItems,
      {
        ...block,
        uid: `${block.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    ];
    syncProblemExpr(nextBuilderItems);
  };

  const removeBuilderItem = (uid) => {
    const nextBuilderItems = builderItems.filter((item) => item.uid !== uid);
    const builderExpr = nextBuilderItems.map((item) => item.value).join(' ').replace(/\s+/g, ' ').trim();
    setBuilderItems(nextBuilderItems);
    setForm((current) => ({
      ...current,
      problem_expr: builderExpr,
    }));
  };

  const clearBuilder = () => {
    setBuilderItems([]);
    updateField('problem_expr', '');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result; // data:image/...;base64,<data>
      updateField('problem_image', b64);
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const handleParseImageExpr = async () => {
    if (!form.problem_image) return;
    setImageParseLoading(true);
    try {
      const raw = form.problem_image.split(',')[1] ?? form.problem_image;
      const result = await parseExpressionImage(raw);
      if (result.expression) {
        updateField('problem_expr', result.expression);
      } else {
        setFormError(result.error || 'Could not extract expression from image.');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setImageParseLoading(false);
    }
  };

  const addCustomBuilderToken = () => {
    const value = customBuilderToken.trim();
    if (!value) return;
    const nextBuilderItems = [
      ...builderItems,
      {
        id: `custom-${Date.now()}`,
        uid: `custom-${Date.now()}`,
        label: value,
        value,
      },
    ];
    syncProblemExpr(nextBuilderItems);
    setCustomBuilderToken('');
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
      setBuilderItems([]);
      setCustomBuilderToken('');      await loadData();
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

  const handleRevealAnswer = async (qid) => {
    if (revealedAnswers[qid]) {
      setRevealedAnswers(prev => { const next = { ...prev }; delete next[qid]; return next; });
      return;
    }
    setLoadingAnswer(qid);
    try {
      const data = await getQuestionAnswer(qid);
      setRevealedAnswers(prev => ({ ...prev, [qid]: data.correct_answer || 'Unable to compute for this problem type.' }));
    } catch (err) {
      setRevealedAnswers(prev => ({ ...prev, [qid]: 'Error: ' + err.message }));
    } finally {
      setLoadingAnswer(null);
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
            <div className="hero-kicker">Teacher Control Panel</div>
            <h1 className="hero-title"><span className="text-gradient">Dashboard</span><br />&amp; Reports.</h1>
            <p className="hero-subtitle">Monitor student submissions, question accuracy, and performance across all topics.</p>
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>TOTAL SUBMISSIONS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{dashboard?.overview.total_submissions || 0}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>STATUS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-success)' }}>ACTIVE</div>
              </div>
            </div>
          </div>
        </section>

        <div className="tab-strip" style={{ marginBottom: '40px' }}>
          {[
            ['dashboard', 'Dashboard'],
            ['create', 'Add Question'],
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
                    <h3 className="card-title" style={{ margin: 0 }}>Student Performance</h3>
                  </div>
                  <div style={{ padding: '32px 40px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Total Submissions</th>
                          <th>Correct</th>
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
                    <h3 className="card-title" style={{ margin: 0 }}>Recent Submissions</h3>
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
              <div className="hero-kicker" style={{ fontSize: '0.65rem' }}>Add Question</div>
              <h3 className="card-title" style={{ marginBottom: '32px' }}>Question Builder</h3>
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
                  <label>Drag & Drop SymPy Builder</label>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '10px',
                      padding: '16px',
                      border: '1px solid var(--border-main)',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.02)',
                    }}>
                      {BUILDER_LIBRARY.map((block) => (
                        <button
                          key={block.id}
                          type="button"
                          draggable
                          onDragStart={(event) => handleDragStart(event, block)}
                          onClick={() => {
                            const nextBuilderItems = [
                              ...builderItems,
                              { ...block, uid: `${block.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
                            ];
                            syncProblemExpr(nextBuilderItems);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-main)',
                            background: 'rgba(12,17,30,0.92)',
                            color: 'white',
                            textAlign: 'left',
                            cursor: 'grab',
                            fontWeight: 700,
                          }}
                        >
                          {block.label}
                        </button>
                      ))}
                    </div>

                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDropToken}
                      style={{
                        minHeight: '96px',
                        padding: '16px',
                        borderRadius: '14px',
                        border: '1px dashed var(--accent-primary)',
                        background: 'rgba(94, 160, 255, 0.05)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '12px' }}>
                        DROP ZONE
                      </div>
                      {builderItems.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Drag blocks here to build a SymPy-friendly question such as `Find the Fourier Series of f(x)=x**2 on (-pi, pi)`.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {builderItems.map((item) => (
                            <button
                              key={item.uid}
                              type="button"
                              onClick={() => removeBuilderItem(item.uid)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '999px',
                                border: '1px solid rgba(94,160,255,0.25)',
                                background: 'rgba(94,160,255,0.08)',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                              }}
                              title="Click to remove"
                            >
                              {item.label} ×
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={customBuilderToken}
                        onChange={(e) => setCustomBuilderToken(e.target.value)}
                        placeholder="Add custom token like x**3 or on (0, 2*pi)"
                        style={{ flex: 1, minWidth: '240px' }}
                      />
                      <button type="button" className="btn btn-outline" onClick={addCustomBuilderToken}>
                        Add Token
                      </button>
                      <button type="button" className="btn btn-outline" onClick={clearBuilder}>
                        Clear Builder
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '24px' }}>
                  <label>Raw Expression (Sympy Compatible)</label>
                  <math-field
                    ref={mathFieldRef}
                    style={{
                      width: '100%',
                      display: 'block',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '1.1rem',
                      color: 'white',
                      minHeight: '62px',
                      '--caret-color': '#00e5be',
                      '--selection-background-color': 'rgba(0,229,190,0.25)',
                      '--text-font-family': 'JetBrains Mono',
                    }}
                  />
                  <div style={{ marginTop: '12px', border: '1px solid var(--border-main)', borderRadius: '12px', overflow: 'hidden' }}>
                    <MathKeyboard onInsert={handleInsertSymbol} />
                  </div>
                </div>

                {/* Image upload for expression */}
                <div style={{ marginTop: '24px', padding: '20px', border: '1px solid var(--border-main)', borderRadius: '14px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '14px' }}>
                    EXPRESSION IMAGE (Optional)
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => imageInputRef.current?.click()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Upload Image
                    </button>
                    {form.problem_image && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleParseImageExpr}
                          disabled={imageParseLoading}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {imageParseLoading ? <div className="spinner" style={{ width: 16, height: 16 }}></div> : 'Parse Expression from Image'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => updateField('problem_image', null)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Remove Image
                        </button>
                      </>
                    )}
                  </div>
                  {form.problem_image && (
                    <div style={{ marginTop: '16px' }}>
                      <img
                        src={form.problem_image}
                        alt="Expression"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', border: '1px solid var(--border-main)', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  {!form.problem_image && (
                    <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Upload an image of the expression. Click "Parse Expression from Image" to auto-fill the expression field via AI.
                    </p>
                  )}
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
                  <div className="hero-kicker" style={{ fontSize: '0.65rem', margin: 0 }}>AI Analysis Preview</div>
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
                    {question.problem_image && (
                      <img
                        src={question.problem_image}
                        alt="Expression"
                        style={{ marginTop: '12px', maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-main)', objectFit: 'contain' }}
                      />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.8rem',
                          flex: 1,
                          borderColor: revealedAnswers[question.id] ? 'var(--accent-primary)' : undefined,
                          color: revealedAnswers[question.id] ? 'var(--accent-primary)' : undefined,
                        }}
                        onClick={() => handleRevealAnswer(question.id)}
                        disabled={loadingAnswer === question.id}
                      >
                        {loadingAnswer === question.id ? 'Computing…' : revealedAnswers[question.id] ? 'Hide Answer' : 'Reveal Answer'}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                        onClick={() => handleDelete(question.id)}
                      >
                        Purge
                      </button>
                    </div>
                    {revealedAnswers[question.id] && (
                      <div style={{
                        marginTop: '14px',
                        padding: '14px 16px',
                        background: 'rgba(94, 160, 255, 0.06)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '8px',
                      }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.08em', marginBottom: '6px' }}>CORRECT ANSWER</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: 'var(--accent-primary)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                          {revealedAnswers[question.id]}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-main)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: #{question.id}</div>
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
