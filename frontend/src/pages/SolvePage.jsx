import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestion, validateSteps, getHint as apiGetHint } from '../api';
import MathKeyboard from '../components/MathKeyboard';

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
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
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
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

  const handleInsertSymbol = (symbol) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newValue = text.substring(0, start) + symbol + text.substring(end);
    setText(newValue);
    if (!timerActive) setTimerActive(true);
    
    // Focus and move cursor
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 0);
  };

  const handleValidate = async () => {
    const steps = text.split('\n').map(s => s.trim()).filter(s => s !== '');
    if (steps.length === 0) return;

    setValidating(true);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setTimerActive(false);

    try {
      const data = await validateSteps({ question_id: parseInt(id), steps });

      // Animate results sequentially
      for (let i = 0; i < data.steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        setResults((prev) => [...(prev || []), data.steps[i]]);
      }
      await new Promise((r) => setTimeout(r, 500));
      setVerdict(data.verdict);
      setCorrectAnswer(data.correct_answer);
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const parsedSteps = text.split('\n').map(s => s.trim()).filter(s => s !== '');
      const data = await apiGetHint({
        question_id: parseInt(id),
        step_number: parsedSteps.length,
      });
      setHint(data.hint);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setHint('');
    setTimer(0);
    setTimerActive(false);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Derived state for lines
  const lines = text.split('\n');

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

  if (!question) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Question not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/questions')}>
              Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>{question.title}</h1>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.15rem', color: 'var(--accent-primary-hover)', marginTop: '8px' }}>
              {question.problem_type === 'integral' ? `∫ ${question.problem_expr} dx` : question.problem_expr}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
            <div className={`timer ${timer > 300 ? 'danger' : timer > 180 ? 'warning' : ''}`}>
              ⏱ {formatTime(timer)}
            </div>
            <button className="btn btn-outline btn-sm red" onClick={() => alert("Issue reported to teacher. Thanks for the feedback!")}>
              🚩 Report Issue
            </button>
          </div>
        </div>

        <div className="solver-layout">
          {/* Editor Panel */}
          <div className="editor-panel">
            <MathKeyboard onInsert={handleInsertSymbol} />
            
            <div className="editor-header" style={{ marginTop: '16px' }}>
              <h3>📝 Code Editor (Step-by-Step)</h3>
              <button className="btn btn-sm btn-outline" onClick={handleReset}>
                ↺ Reset
              </button>
            </div>
            
            <div className="code-editor-container">
              <div className="line-numbers" ref={lineNumbersRef}>
                {lines.map((_, i) => (
                  <div key={i} className="line-number-cell">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="code-textarea"
                value={text}
                onChange={handleTextChange}
                onScroll={handleScroll}
                onCopy={e => { 
                  if (question && !question.allow_copy_paste) {
                    e.preventDefault(); 
                    alert("Copying is disabled for this question!"); 
                  }
                }}
                onPaste={e => { 
                  if (question && !question.allow_copy_paste) {
                    e.preventDefault(); 
                    alert("Pasting is disabled for this question!"); 
                  }
                }}
                spellCheck={false}
                disabled={validating}
                placeholder="Press ENTER to separate steps..."
              />
            </div>
            
            <div className="action-bar" style={{ marginTop: '16px' }}>
              <button className={`btn-run ${validating ? 'running' : ''}`} onClick={handleValidate} disabled={validating || text.trim() === ''}>
                {validating ? <><div className="spinner"></div> Validating...</> : '▶ Run / Validate'}
              </button>
              <button className="btn btn-sm btn-outline" onClick={handleGetHint} disabled={hintLoading}>
                {hintLoading ? 'Loading...' : '💡 Get Hint'}
              </button>
            </div>
            {hint && (
              <div className="hint-box">
                <span className="hint-icon">💡</span>
                <span>{hint}</span>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="output-panel">
            <div className="output-console">
              <div className="console-header">
                <div className="console-dot red"></div>
                <div className="console-dot yellow"></div>
                <div className="console-dot green"></div>
                <span className="console-title">Output Console</span>
              </div>
              <div className="console-body">
                {!results ? (
                  <div className="console-empty">
                    <div className="icon">⚡</div>
                    <p>Click "Run / Validate" to check your solution line-by-line</p>
                  </div>
                ) : (
                  <>
                    {results.map((r, i) => (
                      <div key={i} className={`step-result ${r.valid ? 'valid' : 'invalid'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <span className="result-icon">{r.valid ? '✅' : '❌'}</span>
                        <div>
                          <span className="step-label">Line {r.step}:</span>{' '}
                          <span className="step-expr">{r.expression}</span>
                          {r.error && <div className="step-error">↳ {r.error}</div>}
                        </div>
                      </div>
                    ))}
                    {verdict && (
                      <div className={`verdict-box ${verdict === 'Correct' ? 'correct' : 'incorrect'}`}>
                        {verdict === 'Correct' ? '🎉 Correct Answer!' : '❌ Incorrect Answer'}
                        {correctAnswer && (
                          <div className="correct-answer">Correct answer: {correctAnswer}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
