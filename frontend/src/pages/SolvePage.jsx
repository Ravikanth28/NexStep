import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getHint as apiGetHint, getQuestion, validateSteps } from '../api';
import MathKeyboard from '../components/MathKeyboard';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    loadQuestion();
  }, [id]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimer((current) => current + 1), 1000);
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

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!timerActive) setTimerActive(true);
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleInsertSymbol = (symbol, selectStart, selectEnd) => {
    const editor = textareaRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const nextValue = text.substring(0, start) + symbol + text.substring(end);
    setText(nextValue);
    if (!timerActive) setTimerActive(true);

    setTimeout(() => {
      editor.focus();
      if (selectStart !== undefined && selectEnd !== undefined) {
        editor.setSelectionRange(start + selectStart, start + selectEnd);
      } else {
        editor.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 0);
  };

  const handleValidate = async () => {
    const steps = text.split('\n').map((line) => line.trim()).filter(Boolean);
    if (steps.length === 0) return;

    setValidating(true);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setSubmissionId(null);
    setTimerActive(false);

    try {
      const data = await validateSteps({ question_id: parseInt(id, 10), steps });
      setResults(data.steps || []);
      setVerdict(data.verdict || null);
      setCorrectAnswer(data.correct_answer || null);
      setQuestionAnalysis(data.question_analysis || null);
      setFeedback(data.feedback || null);
      setSubmissionId(data.submission_id || null);
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
      const parsedSteps = text.split('\n').map((line) => line.trim()).filter(Boolean);
      const data = await apiGetHint({ question_id: parseInt(id, 10), step_number: parsedSteps.length });
      setHint(data.hint);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Delete all code and reset?')) return;
    setText('');
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setHint('');
    setSubmissionId(null);
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

  const lines = text.split('\n');

  return (
    <div className="page" style={{ padding: '0 0 60px 0' }}>
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>MODEL CONF</div>
                <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--accent-success)' }}>98.2%</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>COACH NOTES</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                  Provide step-by-step symbolic derivation. Each line must be a unique, balanced transformation for optimal validation throughput.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="builder-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <main>
            <div className="card" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-main)' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Symbolic Input [UTF-8]</h3>
              </div>
              
              <div style={{ background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-main)' }}>
                <MathKeyboard onInsert={handleInsertSymbol} />
              </div>

              <div style={{ flex: 1, display: 'flex', minHeight: '400px', background: '#000' }}>
                <div style={{ width: '50px', borderRight: '1px solid var(--border-main)', padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }} ref={lineNumbersRef}>
                  {lines.map((_, i) => <div key={i} style={{ height: '24px', lineHeight: '24px' }}>{i + 1}</div>)}
                </div>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onScroll={handleScroll}
                  spellCheck={false}
                  placeholder="Insert symbolic steps here... (e.g. ∫(2x+1)dx)"
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    border: 'none', 
                    resize: 'none', 
                    padding: '20px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '1.1rem',
                    lineHeight: '24px',
                    color: 'var(--accent-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-main)', display: 'flex', gap: '16px' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleValidate} disabled={validating}>
                  {validating ? <div className="spinner"></div> : 'Commit & Validate'}
                </button>
                <button className="btn btn-outline" onClick={handleReset}>Reset Workspace</button>
                <button className="btn btn-outline" onClick={handleGetHint} disabled={hintLoading}>
                  {hintLoading ? '...' : 'AI Hint'}
                </button>
              </div>

              {hint && (
                <div style={{ padding: '24px 32px', background: 'rgba(0, 242, 255, 0.05)', borderTop: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                  <strong><span style={{ marginRight: '8px' }}>💡</span> AI Suggested Path:</strong> {hint}
                </div>
              )}
            </div>
          </main>

          <aside>
            <div className="card" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(5, 8, 17, 0.5)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-main)' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Validation Telemetry</h3>
              </div>

              <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                {!results && !validationError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚙️</div>
                    <p style={{ textAlign: 'center' }}>Awaiting symbolic commit for<br />line-by-line verification.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {validationError && (
                      <div className="badge badge-hard" style={{ width: '100%', padding: '16px', fontSize: '0.9rem' }}>
                        SYSTEM ERROR: {validationError}
                      </div>
                    )}
                    
                    {verdict && (
                      <div className={`card ${verdict === 'Correct' ? 'badge-solved' : 'badge-unsolved'}`} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: verdict === 'Correct' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 0, 85, 0.1)' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>VERDICT</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{verdict === 'Correct' ? 'PROVED' : 'FAILED'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>CONFIDENCE</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>100%</div>
                        </div>
                      </div>
                    )}

                    {results && results.map((res, i) => (
                      <div key={i} className="stat-card" style={{ padding: '20px', margin: 0, borderColor: res.valid ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>LINE {res.step}</div>
                          <div className={`badge ${res.valid ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem' }}>{res.valid ? 'VALID' : 'INVALID'}</div>
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', color: res.valid ? 'white' : 'var(--accent-danger)' }}>{res.expression}</div>
                        {res.error && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent-danger)', opacity: 0.8 }}>↳ {res.error}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {feedback && (
                <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderTop: '1px solid var(--border-main)' }}>
                  <div className="hero-kicker" style={{ fontSize: '0.65rem' }}>AI Learning Feedback</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '12px' }}>{feedback.summary}</p>
                  <div className="chip-wrap" style={{ marginTop: '20px' }}>
                    {feedback.strengths.slice(0, 2).map(s => <div className="badge badge-easy" key={s} style={{ fontSize: '0.6rem' }}>{s}</div>)}
                    {feedback.mistakes.slice(0, 2).map(m => <div className="badge badge-hard" key={m} style={{ fontSize: '0.6rem' }}>{m}</div>)}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
