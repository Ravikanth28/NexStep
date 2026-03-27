import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHint as apiGetHint, getQuestion, validateSteps } from '../api';
import MathKeyboard from '../components/MathKeyboard';

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => { loadQuestion(); }, [id]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimer(c => c + 1), 1000);
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
    const steps = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (steps.length === 0) return;
    setValidating(true);
    setResults(null);
    setVerdict(null);
    setCorrectAnswer(null);
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setTimerActive(false);
    try {
      const data = await validateSteps({ question_id: parseInt(id, 10), steps });
      const stepResults = data.steps || [];
      setResults(stepResults);
      setVerdict(data.verdict || null);
      setCorrectAnswer(data.correct_answer || null);
      setQuestionAnalysis(data.question_analysis || null);
      setFeedback(data.feedback || null);
      if (data.error) setValidationError(data.error);
      if (stepResults.length === 0 && data.error) {
        setResults([{ step: 1, expression: 'Validation engine error', valid: false, error: data.error }]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
      setValidationError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const parsedSteps = text.split('\n').map(line => line.trim()).filter(Boolean);
      const data = await apiGetHint({ question_id: parseInt(id, 10), step_number: parsedSteps.length });
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
    setValidationError('');
    setQuestionAnalysis(null);
    setFeedback(null);
    setHint('');
    setTimer(0);
    setTimerActive(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const getVerdictLabel = () => {
    if (verdict === 'Correct') return 'Correct Answer';
    if (verdict === 'Error') return 'Validation Error';
    return verdict || 'Incorrect Answer';
  };

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
            <button className="btn btn-primary" onClick={() => navigate('/questions')}>Back to Questions</button>
          </div>
        </div>
      </div>
    );
  }

  const validCount = results ? results.filter(r => r.valid).length : 0;
  const totalCount = results ? results.length : 0;

  return (
    <div className="page" style={{ padding: '20px 24px', height: 'auto', overflow: 'visible' }}>
      <div style={{ display: 'flex', gap: '24px' }}>

        {/* LEFT: Question */}
        <div style={{ width: '32%', flexShrink: 0 }}>
          <div className="workspace-hero solve-hero" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div className="hero-kicker">Guided Solve Mode</div>
              <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>{question.title}</h2>
              <div className="chip-wrap" style={{ marginBottom: '8px', gap: '6px', flexWrap: 'wrap' }}>
                <span className="soft-pill" style={{ fontSize: '0.75rem' }}>{question.topic}</span>
                <span className="soft-pill" style={{ fontSize: '0.75rem' }}>{question.validation_strategy || question.problem_type}</span>
              </div>
              <p className="hero-expression" style={{ fontSize: '1.2rem', marginTop: '8px', lineHeight: '1.6' }}>
                {question.problem_expr}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={'badge badge-' + question.difficulty}>{question.difficulty}</span>
              <div className={'timer' + (timer > 300 ? ' danger' : timer > 180 ? ' warning' : '')}>
                {formatTime(timer)}
              </div>
            </div>
          </div>

          {questionAnalysis && (
            <div className="analysis-panel" style={{ marginBottom: '16px' }}>
              <div className="panel-label">Validation Strategy</div>
              <div className="analysis-grid">
                <div className="analysis-item">
                  <span className="analysis-label">Topic</span>
                  <strong>{questionAnalysis.topic}</strong>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">Strategy</span>
                  <strong>{questionAnalysis.validation_strategy}</strong>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">Confidence</span>
                  <strong>{Math.round((questionAnalysis.analysis_confidence || 0) * 100)}%</strong>
                </div>
              </div>
            </div>
          )}

          {feedback && (
            <div className="feedback-panel">
              <div className="panel-label">Learning Feedback</div>
              <p className="feedback-summary">{feedback.summary}</p>
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="feedback-group">
                  <h4>What you did well</h4>
                  {feedback.strengths.map(item => (
                    <div key={item} className="feedback-chip good">{item}</div>
                  ))}
                </div>
              )}
              {feedback.mistakes && feedback.mistakes.length > 0 && (
                <div className="feedback-group">
                  <h4>What to fix</h4>
                  {feedback.mistakes.map(item => (
                    <div key={item} className="feedback-chip warn">{item}</div>
                  ))}
                </div>
              )}
              {feedback.next_step && (
                <div className="feedback-next">
                  <strong>Next suggestion:</strong> {feedback.next_step}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Editor + Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* Editor */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <MathKeyboard onInsert={handleInsertSymbol} />
            <div className="editor-header">
              <h3>Step Editor</h3>
              <button className="btn btn-sm btn-outline" onClick={handleReset}>Reset</button>
            </div>
            <div className="code-editor-container" style={{ minHeight: '200px' }}>
              <div className="line-numbers" ref={lineNumbersRef}>
                {lines.map((_, i) => (
                  <div key={i} className="line-number-cell">{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="code-textarea"
                value={text}
                onChange={handleTextChange}
                onScroll={handleScroll}
                onCopy={e => { if (question && !question.allow_copy_paste) { e.preventDefault(); alert('Copying is disabled for this question.'); } }}
                onPaste={e => { if (question && !question.allow_copy_paste) { e.preventDefault(); alert('Pasting is disabled for this question.'); } }}
                spellCheck={false}
                disabled={validating}
                placeholder="Write one mathematical step per line."
              />
            </div>
            <div className="action-bar">
              <button className={'btn-run' + (validating ? ' running' : '')} onClick={handleValidate} disabled={validating || text.trim() === ''}>
                {validating ? 'Validating...' : 'Run / Validate'}
              </button>
              <button className="btn btn-sm btn-outline" onClick={handleGetHint} disabled={hintLoading}>
                {hintLoading ? 'Loading...' : 'Get Hint'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => alert('Issue reported to teacher. Thanks!')}>Report Issue</button>
            </div>
            {hint && (
              <div className="hint-box">
                <span className="hint-icon">Hint</span>
                <span>{hint}</span>
              </div>
            )}
          </div>

          {/* Output */}
          <div>
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
                    <div className="icon">Analyze</div>
                    <p>Run validation to inspect your solution line by line.</p>
                  </div>
                ) : (
                  <div>
                    {validationError && (
                      <div className="step-result invalid">
                        <span className="result-icon">X</span>
                        <div>
                          <span className="step-label">Error: </span>
                          <span className="step-expr">{validationError}</span>
                        </div>
                      </div>
                    )}
                    {totalCount > 0 && (
                      <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '8px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{validCount}/{totalCount}</strong> steps valid</span>
                        <button onClick={() => setExpandedSteps(v => !v)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.85rem' }}>
                          {expandedSteps ? '- Hide' : '+ Show'}
                        </button>
                      </div>
                    )}
                    {expandedSteps && results.map((result, idx) => (
                      <div key={idx} className={'step-result ' + (result.valid ? 'valid' : 'invalid')} style={{ fontSize: '0.9rem', padding: '6px 10px' }}>
                        <span className="result-icon">{result.valid ? 'OK' : 'X'}</span>
                        <div>
                          <span className="step-label">Line {result.step}: </span>
                          <span className="step-expr">{result.expression}</span>
                          {result.error && <div className="step-error" style={{ fontSize: '0.85rem' }}>Error: {result.error}</div>}
                        </div>
                      </div>
                    ))}
                    {verdict && (
                      <div className={'verdict-box ' + (verdict === 'Correct' ? 'correct' : 'incorrect')} style={{ marginTop: '8px' }}>
                        {getVerdictLabel()}
                        {correctAnswer && (
                          <div className="correct-answer" style={{ fontSize: '0.9rem' }}>Reference answer: {correctAnswer}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
