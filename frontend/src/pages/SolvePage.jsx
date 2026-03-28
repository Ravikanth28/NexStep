import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHint as apiGetHint, getQuestion, validateSteps, visionParse } from '../api';
import MathKeyboard from '../components/MathKeyboard';
import MathGraph from '../components/MathGraph';
import FlowControl from '../components/FlowControl';
import NeuralHUD from '../components/NeuralHUD';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Memoized sub-components to prevent flickering during text changes
const MemoizedGraph = memo(MathGraph);
const MemoizedHUD = memo(NeuralHUD);

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [gamification, setGamification] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [workspacePulse, setWorkspacePulse] = useState('idle');
  const [currentExpr, setCurrentExpr] = useState('');
  const [showScaffold, setShowScaffold] = useState(false);
  const [deepFocus, setDeepFocus] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastActivity = useRef(Date.now());
  const lastValidExpr = useRef('');

  useEffect(() => {
    let mounted = true;
    (async () => {
        setLoading(true);
        try {
            const data = await getQuestion(id);
            if (mounted) setQuestion(data);
        } catch (e) { console.error(e); }
        finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (timerActive) setTimer((t) => t + 1);
        if (!testMode && Date.now() - lastActivity.current > 60000 && !showScaffold && text.trim().length > 5) {
            setShowScaffold(true);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, text, showScaffold, testMode]);

  const handleTextChange = useCallback((e) => {
    const val = e.target.value;
    setText(val);
    lastActivity.current = Date.now();
    setShowScaffold(false);
    if (!timerActive && val.length > 0) setTimerActive(true);
    const lines = val.split('\n').filter(Boolean);
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine !== lastValidExpr.current) {
        setCurrentExpr(lastLine);
        lastValidExpr.current = lastLine;
      }
    }
  }, [timerActive]);

  const handleScroll = useCallback(() => { 
    if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleInsertSymbol = useCallback((symbol, selectStart, selectEnd) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    setText(newText);
    
    // Smooth Focus
    requestAnimationFrame(() => {
        el.focus();
        if (selectStart !== undefined) {
            el.selectionStart = start + selectStart;
            el.selectionEnd = start + selectEnd;
        } else {
            el.selectionStart = el.selectionEnd = start + symbol.length;
        }
    });
  }, [text]);

  const handleValidate = async () => {
    if (!text.trim()) return;
    setValidating(true);
    setWorkspacePulse('thinking');
    try {
      const steps = text.split('\n').map(s => s.trim()).filter(Boolean);
      const data = await validateSteps({ question_id: parseInt(id, 10), steps, time_taken: timer });
      setResults(data.steps);
      setVerdict(data.verdict);
      setFeedback(data.feedback);
      setGamification(data.gamification);
      setWorkspacePulse(data.verdict === 'Correct' ? 'success' : 'error');
      if (data.verdict === 'Correct') setTimerActive(false);
    } catch (err) { setWorkspacePulse('error'); }
    finally { setValidating(false); }
  };

  const handleVisionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVisionLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const data = await visionParse({ image_b64: reader.result.split(',')[1] });
        if (data.steps) setText(prev => (prev ? prev + '\n' : '') + data.steps.join('\n'));
      } catch (err) { console.error(err); }
      finally { setVisionLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleExportLaTeX = () => {
    const steps = text.split('\n').filter(Boolean);
    const latex = `\\begin{equation*}\n\\begin{aligned}\n${steps.map(s => `  &${s.replace(/\*\*/g, '^').replace(/\*/g, '\\cdot ')} \\\\`).join('\n')}\n\\end{aligned}\n\\end{equation*}`;
    navigator.clipboard.writeText(latex);
    alert('LaTeX Block Copied!');
  };

  const handleGetHint = async () => {
    if (testMode || hintLoading) return;
    setHintLoading(true);
    try {
      const steps = text.split('\n').map(s => s.trim()).filter(Boolean);
      const data = await apiGetHint({ question_id: parseInt(id, 10), step_number: steps.length });
      setHint(data.hint);
      setShowScaffold(false);
    } catch (e) { }
    finally { setHintLoading(false); }
  };

  if (loading || !question) return (
    <div className="page" style={{ background: '#02040a', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const lineCount = text.split('\n').length;

  return (
    <div className={`page solve-page pulse-${workspacePulse} ${deepFocus ? 'deep-focus-active' : ''}`} style={{ padding: '0 0 60px 0' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Nav Bar Logic */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/questions')}>&larr; WORKSPACE EXIT</button>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <FlowControl />
            <button className={`btn ${testMode ? 'btn-hard' : 'btn-outline'}`} onClick={() => { setTestMode(!testMode); setHint(''); }} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
              {testMode ? 'EXAM MODE' : 'PRACTICE MODE'}
            </button>
            <button className={`btn ${deepFocus ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDeepFocus(!deepFocus)} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
              FOCUS
            </button>
          </div>
        </div>

        {!deepFocus && (
          <section className="workspace-hero" style={{ padding: '40px', gridTemplateColumns: '1fr 400px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border-main)' }}>
            <div>
              <div className="hero-kicker">Neural Symbolic Solver</div>
              <h1 className="hero-title" style={{ fontSize: '2.4rem' }}>{question.title}</h1>
              <div className="problem" style={{ fontSize: '1.4rem', padding: '24px', background: '#000', borderRadius: '16px', border: '1px solid var(--accent-primary)', boxShadow: '0 0 40px rgba(0, 242, 255, 0.1)' }}>{question.problem_expr}</div>
              <div style={{ marginTop: '32px' }}>
                <MemoizedGraph expression={currentExpr} problemExpr={question.problem_expr} />
              </div>
            </div>
            <div className="card" style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', border: '1px solid var(--border-main)' }}>
               <h3 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '16px', fontWeight: 800 }}>TELEMETRY</h3>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div><div className="stat-label">TOPIC</div><div className="stat-value" style={{ fontSize: '1rem' }}>{question.topic}</div></div>
                 <div><div className="stat-label">VELOCITY</div><div className="stat-value" style={{ fontSize: '1rem' }}>{formatTime(timer)}</div></div>
               </div>
               {gamification && <div style={{ marginTop: '32px', padding: '16px', border: '1px solid var(--accent-primary)', borderRadius: '12px' }}><span style={{ fontSize: '0.8rem', fontWeight: 800 }}>LVL {gamification.level} (+{gamification.xp_gained} XP)</span></div>}
            </div>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: deepFocus ? '1fr' : '1fr 450px', gap: '32px' }}>
          <main>
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-main)', background: 'transparent' }}>
              <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', alignItems: 'center', borderBottom: '1px solid var(--border-main)' }}>
                 <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>COMMAND CONSOLE</span>
                 <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.7rem' }} onClick={() => fileInputRef.current.click()}>{visionLoading ? 'PROCESSING...' : '📷 VISION SCAN'}</button>
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleVisionUpload} />
              </div>
              
              <MathKeyboard onInsert={handleInsertSymbol} />

              <div style={{ display: 'flex', background: '#010409', minHeight: deepFocus ? '72vh' : '480px' }}>
                <div style={{ width: '56px', borderRight: '1px solid var(--border-main)', padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }} ref={lineNumbersRef}>{[...Array(Math.max(lineCount, 18))].map((_, i) => <div key={i} style={{ height: '32px' }}>{i + 1}</div>)}</div>
                <textarea ref={textareaRef} value={text} onChange={handleTextChange} onScroll={handleScroll} placeholder="Initiate derivation protocol..." style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', padding: '24px', fontFamily: 'JetBrains Mono', fontSize: '1.1rem', lineHeight: '32px', color: 'white', outline: 'none' }} />
              </div>

              <div style={{ padding: '24px 32px', display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--border-main)' }}>
                <button className="btn btn-primary" style={{ flex: 2, padding: '16px' }} onClick={handleValidate} disabled={validating}>{validating ? 'VERIFYING...' : 'COMMIT DERIVATION'}</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleExportLaTeX}>LaTeX</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { if (window.confirm('Reset?')) setText(''); }}>PURGE</button>
                {!testMode && <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleGetHint} disabled={hintLoading}>HINT</button>}
              </div>

              {hint && !testMode && <div style={{ padding: '20px 32px', background: 'rgba(0, 242, 255, 0.05)', color: 'var(--accent-primary)', borderTop: '1px solid var(--accent-primary)' }}><strong>💡 SCAFFOLD:</strong> {hint}</div>}
              {showScaffold && !hint && !testMode && <div style={{ padding: '20px 32px', background: 'rgba(255, 184, 0, 0.05)', color: 'var(--accent-warning)', borderTop: '1px solid var(--accent-warning)', display: 'flex', justifyContent: 'space-between' }}><span><strong>🤔 STUCK?</strong> Engine detects cognitive stall.</span><button style={{ color: 'var(--accent-warning)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800 }} onClick={handleGetHint}>REQUEST</button></div>}
            </div>
          </main>

          {!deepFocus && (
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {!testMode && <MemoizedHUD topic={question.topic} />}
                <div className="card" style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-main)' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}><h3 style={{ fontSize: '0.8rem', margin: 0, color: 'var(--accent-primary)' }}>VALIDATION LOG</h3></div>
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    {results ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className={`badge ${verdict === 'Correct' ? 'badge-solved' : 'badge-unsolved'}`} style={{ width: '100%', textAlign: 'center', padding: '12px', fontSize: '0.8rem' }}>{verdict.toUpperCase()}</div>
                        {feedback && (
                          <div style={{ padding: '16px', background: 'rgba(0, 242, 255, 0.02)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>Expert Neural Critique</div>
                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0, color: 'var(--text-primary)', lineHeight: 1.5 }}>"{feedback.expert_insight || feedback.summary}"</p>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {results.map((res, i) => <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'JetBrains Mono', border: `1px solid ${res.valid ? 'rgba(0,242,255,0.1)' : 'rgba(255,0,85,0.2)'}`, color: res.valid ? 'white' : 'var(--accent-danger)' }}>{res.expression}</div>)}
                        </div>
                      </div>
                    ) : <div style={{ opacity: 0.2, textAlign: 'center', marginTop: '40%', fontSize: '0.8rem' }}>📡 SYNCING WITH NEURAL ENGINE...</div>}
                  </div>
                </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
