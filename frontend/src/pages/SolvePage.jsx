import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestion, validateSteps, getHint as apiGetHint } from '../api';

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [steps, setSteps] = useState(['']);
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const inputRefs = useRef([]);

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

  const updateStep = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
    if (!timerActive) setTimerActive(true);
  };

  const addStep = () => {
    setSteps([...steps, '']);
    setTimeout(() => {
      inputRefs.current[steps.length]?.focus();
    }, 50);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === steps.length - 1) {
        addStep();
      } else {
        inputRefs.current[index + 1]?.focus();
      }
    }
    if (e.key === 'Backspace' && steps[index] === '' && steps.length > 1) {
      e.preventDefault();
      removeStep(index);
      inputRefs.current[Math.max(0, index - 1)]?.focus();
    }
  };

  const insertSymbol = (symbol) => {
    const activeIndex = inputRefs.current.findIndex((r) => r === document.activeElement);
    const idx = activeIndex >= 0 ? activeIndex : steps.length - 1;
    const input = inputRefs.current[idx];
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = steps[idx].substring(0, start) + symbol + steps[idx].substring(end);
      updateStep(idx, newValue);
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + symbol.length;
        input.focus();
      }, 10);
    }
  };

  const handleValidate = async () => {
    const filledSteps = steps.filter((s) => s.trim() !== '');
    if (filledSteps.length === 0) return;

    setValidating(true);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setTimerActive(false);

    try {
      const data = await validateSteps({ question_id: parseInt(id), steps: filledSteps });

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
      const data = await apiGetHint({
        question_id: parseInt(id),
        step_number: steps.filter((s) => s.trim()).length,
      });
      setHint(data.hint);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleReset = () => {
    setSteps(['']);
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

  const getStepStatus = (index) => {
    if (!results) return '';
    const res = results.find((r) => r.step === index + 1);
    if (!res) return '';
    return res.valid ? 'success' : 'error';
  };

  const getStepIcon = (index) => {
    if (!results) return '';
    const res = results.find((r) => r.step === index + 1);
    if (!res) return '';
    return res.valid ? '✅' : '❌';
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
              ∫ {question.problem_expr} dx
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
            <div className={`timer ${timer > 300 ? 'danger' : timer > 180 ? 'warning' : ''}`}>
              ⏱ {formatTime(timer)}
            </div>
          </div>
        </div>

        <div className="solver-layout">
          {/* Editor Panel */}
          <div className="editor-panel">
            <div className="editor-header">
              <h3>📝 Solution Editor</h3>
              <button className="btn btn-sm btn-outline" onClick={handleReset}>
                ↺ Reset
              </button>
            </div>
            <div className="step-editor">
              <div className="editor-toolbar">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>Insert:</span>
                {['∫', 'x²', 'x³', 'π', '√', 'sin', 'cos', 'ln', 'eˣ', '+ C'].map((sym) => (
                  <button key={sym} className="toolbar-btn" onClick={() => insertSymbol(sym === 'x²' ? 'x^2' : sym === 'x³' ? 'x^3' : sym === '√' ? 'sqrt(' : sym === 'eˣ' ? 'exp(x)' : sym)}>
                    {sym}
                  </button>
                ))}
              </div>
              <div className="step-lines">
                {steps.map((step, i) => (
                  <div key={i} className={`step-line ${getStepStatus(i)}`}>
                    <div className="line-number">{i + 1}</div>
                    <div className="line-status">{getStepIcon(i)}</div>
                    <input
                      ref={(el) => (inputRefs.current[i] = el)}
                      className="step-input"
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      placeholder={i === 0 ? 'Enter first step...' : 'Next step...'}
                      disabled={validating}
                    />
                    <div className="line-remove" onClick={() => removeStep(i)}>
                      ×
                    </div>
                  </div>
                ))}
              </div>
              <button className="add-step-btn" onClick={addStep} disabled={validating}>
                + Add Step
              </button>
            </div>
            <div className="action-bar">
              <button className={`btn-run ${validating ? 'running' : ''}`} onClick={handleValidate} disabled={validating || steps.every((s) => !s.trim())}>
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
                    <p>Click "Run / Validate" to check your solution</p>
                  </div>
                ) : (
                  <>
                    {results.map((r, i) => (
                      <div key={i} className={`step-result ${r.valid ? 'valid' : 'invalid'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <span className="result-icon">{r.valid ? '✅' : '❌'}</span>
                        <div>
                          <span className="step-label">Step {r.step}:</span>{' '}
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
