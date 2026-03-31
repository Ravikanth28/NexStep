import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHint as apiGetHint, getQuestion, getStepHint, validateSteps } from '../api';
import MathKeyboard from '../components/MathKeyboard';
import MathStepEditor from '../components/MathStepEditor';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [steps, setSteps] = useState(['']);
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [solutionSteps, setSolutionSteps] = useState([]);
  const [evaluationMode, setEvaluationMode] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [hint, setHint] = useState('');
  const [hintFormulas, setHintFormulas] = useState([]);
  const [hintApproach, setHintApproach] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [stepHints, setStepHints] = useState({});
  const [loadingHintIndex, setLoadingHintIndex] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const insertFromKeyboardRef = useRef(null);

  useEffect(() => {
    loadQuestion();
  }, [id]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimer((c) => c + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const data = await getQuestion(id);
      setQuestion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepsChange = useCallback((newSteps) => {
    setSteps(newSteps);
    if (!timerActive) setTimerActive(true);
  }, [timerActive]);

  // Called by MathKeyboard – forwards LaTeX into the active MathLive field
  const handleInsertSymbol = (latex) => {
    if (insertFromKeyboardRef.current) {
      insertFromKeyboardRef.current(latex);
    }
    if (!timerActive) setTimerActive(true);
  };

  const handleValidate = async () => {
    const latexSteps = steps.filter((s) => s.trim());
    if (latexSteps.length === 0) return;

    setValidating(true);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setSubmissionId(null);
    setSolutionSteps([]);
    setEvaluationMode('');
    setOverallFeedback('');
    setTimerActive(false);

    try {
      // Send latex_steps so the backend converts them to SymPy via parse_latex.
      // Also send a plain-text fallback in `steps` (the same strings) in case
      // the question was entered in SymPy notation directly.
      const data = await validateSteps({
        question_id: parseInt(id, 10),
        steps: latexSteps,          // fallback plain steps
        latex_steps: latexSteps,    // primary: LaTeX from MathLive
      });
      setResults(data.steps || []);
      setVerdict(data.verdict || null);
      setCorrectAnswer(data.correct_answer || null);
      setQuestionAnalysis(data.question_analysis || null);
      setFeedback(data.feedback || null);
      setSubmissionId(data.submission_id || null);
      setSolutionSteps(data.solution_steps || []);
      setEvaluationMode(data.evaluation_mode || '');
      setOverallFeedback(data.overall_feedback || '');
      if (data.error) setValidationError(data.error);
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const data = await apiGetHint({ question_id: parseInt(id, 10), step_number: steps.filter(s => s.trim()).length });
      setHint(data.hint);
      setHintFormulas(data.formulas || []);
      setHintApproach(data.approach || '');
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleStepHint = async (stepIndex) => {
    setLoadingHintIndex(stepIndex);
    try {
      const data = await getStepHint({
        question_id: parseInt(id, 10),
        step_index: stepIndex,
        latex_steps: steps.filter((s) => s.trim()),
      });
      setStepHints((prev) => ({ ...prev, [stepIndex]: data.hint }));
    } catch (err) {
      setStepHints((prev) => ({ ...prev, [stepIndex]: 'Could not get hint right now.' }));
    } finally {
      setLoadingHintIndex(null);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Delete all code and reset?')) return;
    setSteps(['']);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setHint('');
    setHintFormulas([]);
    setHintApproach('');
    setStepHints({});
    setSubmissionId(null);
    setSolutionSteps([]);
    setEvaluationMode('');
    setOverallFeedback('');
    setTimer(0);
    setTimerActive(false);
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

  if (!question) {
    return (
      <div className="page">
        <div className="container">
          <div className="card empty-state">
            <h3>Question not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/questions')}>Back to Workspace</button>
          </div>
        </div>
      </div>
    );
  }

  const activeStepCount = steps.filter((s) => s.trim()).length;
  const validCount = results ? results.filter((r) => r.valid).length : 0;
  const invalidCount = results ? results.length - validCount : 0;

  return (
    <div className="page solve-screen" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={() => navigate('/questions')}>
            &larr; Exit Workspace
          </button>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>SESSION TIMER</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', fontWeight: 700, color: timerActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {formatTime(timer)}
              </div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-main)' }}></div>
            <div className="brand-mark" style={{ borderRadius: '8px', fontSize: '0.7rem' }}>Nx</div>
          </div>
        </div>

        <section className="workspace-hero" style={{ padding: '50px', gridTemplateColumns: 'minmax(0, 1fr) 450px', minHeight: '300px' }}>
          <div>
            <div className="hero-kicker">Neural Symbolic Solver v4.0</div>
            <h1 className="hero-title" style={{ fontSize: '3rem' }}>{question.title}</h1>
            <div className="chip-wrap" style={{ margin: '20px 0' }}>
              <div className="badge badge-easy">{question.subject || 'Engineering Math'}</div>
              <div className="badge badge-medium">{question.topic}</div>
              <div className="badge badge-hard">{question.difficulty}</div>
            </div>
            <div className="problem" style={{ fontSize: '1.5rem', padding: '24px', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--accent-primary)' }}>
              {question.problem_expr}
            </div>
          </div>

          <div className="card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
            <div className="hero-kicker" style={{ fontSize: '0.65rem', marginBottom: '20px' }}>AI Routing Metadata</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>STRATEGY</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{question.validation_strategy || 'Symbolic'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>EVALUATION</div>
                <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--accent-success)' }}>{evaluationMode || 'NVIDIA judge'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>COACH NOTES</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                  Symbols are docked on the left, your editor is on the right, and the output below compares SymPy reference steps with the AI evaluation.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="solver-top-grid">
          <section className="solver-panel solver-symbols-panel">
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Notation Center</div>
                <h3 className="solver-title">Fast Symbolic Tools</h3>
              </div>
              <div className="solver-head-badge">left dock</div>
            </div>
            <div className="solver-panel-body">
              <div className="solver-keyboard-shell solver-keyboard-shell-standalone">
                <MathKeyboard onInsert={handleInsertSymbol} />
              </div>
            </div>
          </section>

          <main className="solver-panel solver-editor-panel">
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Student Workspace</div>
                <h3 className="solver-title">Editor [UTF-8]</h3>
              </div>
              <div className="solver-head-badge">{activeStepCount} steps</div>
            </div>
            <div className="solver-panel-body">
              <div className="solver-editor-shell solver-editor-shell-tall" style={{ padding: '12px 16px', overflowY: 'auto' }}>
                <MathStepEditor
                  steps={steps}
                  onChange={handleStepsChange}
                  results={results}
                  onInsertFromKeyboard={insertFromKeyboardRef}
                  activeStepIndex={activeStepIndex}
                  onActiveStepChange={setActiveStepIndex}
                  onStepHint={handleStepHint}
                  stepHints={stepHints}
                  loadingHintIndex={loadingHintIndex}
                />
              </div>

              <div className="solver-action-bar">
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleValidate} disabled={validating}>
                  {validating ? <div className="spinner"></div> : 'Commit & Validate'}
                </button>
                <button className="btn btn-outline" onClick={handleReset}>Reset Workspace</button>
                <button className="btn btn-outline" onClick={handleGetHint} disabled={hintLoading}>
                  {hintLoading ? '...' : 'AI Hint'}
                </button>
              </div>

              {(hint || hintFormulas.length > 0) && (
                <div className="solver-hint" style={{ padding: '20px 24px', borderTop: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {hintApproach && (
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.08em', marginBottom: '4px' }}>APPROACH</div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{hintApproach}</div>
                    </div>
                  )}
                  {hint && (
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.08em', marginBottom: '4px' }}>AI HINT</div>
                      <div style={{ fontSize: '0.88rem' }}>{hint}</div>
                    </div>
                  )}
                  {hintFormulas.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f0c040', letterSpacing: '0.08em', marginBottom: '10px' }}>📋 RELEVANT FORMULAS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hintFormulas.map((f, i) => (
                          <div key={i} style={{ background: 'rgba(255,200,0,0.05)', border: '1px solid rgba(255,200,0,0.18)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f0c040', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase' }}>{f.name}</div>
                            <math-field
                              read-only=""
                              style={{
                                display: 'block',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.05rem',
                                outline: 'none',
                                '--text-font-family': 'JetBrains Mono',
                              }}
                            >{f.latex}</math-field>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        <div className="solver-output-grid">
          <section className="solver-panel">
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Reference Engine</div>
                <h3 className="solver-title">SymPy Steps</h3>
              </div>
              <div className="solver-head-badge">{solutionSteps.length || 0} steps</div>
            </div>
            <div className="solver-panel-body solver-telemetry-body">
              {solutionSteps.length === 0 ? (
                <div className="telemetry-empty">
                  <div className="telemetry-empty-icon">∑</div>
                  <p>Awaiting validation to generate the SymPy reference path.</p>
                </div>
              ) : (
                <div className="solution-list solution-list-always-open">
                  {solutionSteps.map((s) => (
                    <div key={s.step} className="solution-step">
                      <div className="solution-step-index">{s.step}</div>
                      <div style={{ flex: 1 }}>
                        <div className="solution-step-title">{s.title}</div>
                        <div className="solution-step-detail">{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="solver-panel">
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Model Evaluation</div>
                <h3 className="solver-title">AI Evaluation</h3>
              </div>
              <div className="solver-head-badge">{evaluationMode || 'awaiting_run'}</div>
            </div>
            <div className="solver-panel-body solver-telemetry-body">
              {!results && !validationError ? (
                <div className="telemetry-empty">
                  <div className="telemetry-empty-icon">◌</div>
                  <p>Awaiting symbolic commit for line-by-line verification.</p>
                </div>
              ) : (
                <div className="telemetry-stack">
                  <div className="telemetry-strip">
                    <div className="telemetry-mini">
                      <div className="telemetry-mini-label">Verdict</div>
                      <div className={`telemetry-mini-value ${verdict === 'Correct' ? 'is-good' : 'is-bad'}`}>
                        {verdict || 'Pending'}
                      </div>
                    </div>
                    <div className="telemetry-mini">
                      <div className="telemetry-mini-label">Valid</div>
                      <div className="telemetry-mini-value is-good">{validCount}</div>
                    </div>
                    <div className="telemetry-mini">
                      <div className="telemetry-mini-label">Invalid</div>
                      <div className="telemetry-mini-value is-bad">{invalidCount}</div>
                    </div>
                  </div>

                  {validationError && (
                    <div className="telemetry-error">
                      SYSTEM ERROR: {validationError}
                    </div>
                  )}

                  {overallFeedback && (
                    <div className="telemetry-card telemetry-card-info">
                      <div className="telemetry-card-label">Overall Feedback</div>
                      <div className="telemetry-copy">{overallFeedback}</div>
                    </div>
                  )}

                  {correctAnswer && (
                    <div className="telemetry-card telemetry-card-accent">
                      <div className="telemetry-card-label">Engine Correct Answer</div>
                      <div className="telemetry-mono">{correctAnswer}</div>
                      {verdict !== 'Correct' && (
                        <div className="telemetry-copy subtle">
                          Compare your final step against this result to find where your derivation went wrong.
                        </div>
                      )}
                    </div>
                  )}

                  {results && results.map((res, i) => (
                    <div key={i} className={`telemetry-step ${res.valid ? 'is-valid' : 'is-invalid'}`}>
                      <div className="telemetry-step-top">
                        <div className="telemetry-step-line">LINE {res.step}</div>
                        <div className={`badge ${res.valid ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem' }}>
                          {res.valid ? 'VALID' : 'INVALID'}
                        </div>
                      </div>
                      <div className="telemetry-step-expression">{res.expression}</div>
                      {!res.valid && res.error && (
                        <div className="telemetry-step-note invalid-note">
                          <span>Why invalid:</span> {res.error}
                        </div>
                      )}
                      {res.valid && res.error && (
                        <div className="telemetry-step-note valid-note">{res.error}</div>
                      )}
                    </div>
                  ))}

                  {feedback && (
                    <div className="telemetry-card">
                      <div className="telemetry-card-label">AI Learning Feedback</div>
                      <div className="telemetry-copy">{feedback.summary}</div>
                      {(feedback.mistakes.length > 0) && (
                        <div className="telemetry-chip-column">
                          {feedback.mistakes.slice(0, 3).map((m) => (
                            <div key={m} className="telemetry-chip telemetry-chip-bad">{m}</div>
                          ))}
                        </div>
                      )}
                      {(feedback.strengths.length > 0) && (
                        <div className="telemetry-chip-column">
                          {feedback.strengths.slice(0, 2).map((s) => (
                            <div key={s} className="telemetry-chip telemetry-chip-good">{s}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {questionAnalysis && (
                    <div className="telemetry-card">
                      <div className="telemetry-card-label">Question Analysis</div>
                      <div className="telemetry-copy">
                        {questionAnalysis.subject} • {questionAnalysis.topic} • {questionAnalysis.validation_strategy}
                      </div>
                    </div>
                  )}

                  {submissionId && (
                    <div className="telemetry-card">
                      <div className="telemetry-card-label">Submission</div>
                      <div className="telemetry-copy">Saved as #{submissionId}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
