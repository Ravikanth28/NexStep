import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuestionSolution } from '../api';
import { mathExprToSpeech, pauseSpeech, resumeSpeech, speak, stopSpeech } from '../utils/mathSpeech';
import 'mathlive';

function splitWorkedStep(step) {
  const text = String(step || '').trim();
  if (text.length <= 90) return [text];

  let remaining = text;
  const lines = [];
  const firstColon = remaining.indexOf(':');

  if (firstColon > 0 && firstColon < 42) {
    lines.push(remaining.slice(0, firstColon + 1).trim());
    remaining = remaining.slice(firstColon + 1).trim();
  }

  remaining = remaining
    .replace(/;\s*(?=at\b)/gi, '\n')
    .replace(/,\s*(?=at\b)/gi, '\n')
    .replace(/\s*(⇒|=>|->)\s*/g, '\n$1 ');

  return lines.concat(
    remaining
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

function explainWorkedStep(step, index) {
  const text = String(step || '').toLowerCase();

  if (/\bn\(s\)|sample space|total/.test(text)) {
    return 'This identifies all equally likely outcomes, which becomes the denominator of the probability.';
  }
  if (/\bn\(a\)|favourable|favorable|kings|queens|aces|even outcomes|odd outcomes/.test(text)) {
    return 'This counts only the outcomes that satisfy the event, which becomes the numerator.';
  }
  if (/p\(a\)|probability formula|n\(a\)\s*\/\s*n\(s\)/.test(text)) {
    return 'Now we place favorable outcomes over total outcomes using the basic probability rule.';
  }
  if (/simplify|final answer|=/.test(text) && /\d+\s*\/\s*\d+/.test(text)) {
    return 'The fraction is reduced to its simplest exact form, which is the final probability.';
  }
  if (/formula|definition/.test(text)) {
    return 'This writes the standard formula first so the substitution is mathematically grounded.';
  }
  if (/substitute|replace/.test(text)) {
    return 'Here we put the given function or values into the formula before simplifying.';
  }
  if (/integration by parts|integrate|∫|integral/.test(text)) {
    return 'This performs the required integration step and turns the expression into a simpler form.';
  }
  if (/boundary|limit|at x=|evaluate/.test(text)) {
    return 'This applies the limits carefully so the definite expression becomes a concrete value.';
  }

  return index === 0
    ? 'This starts the solution by setting up the main quantity we need to compute.'
    : 'This continues the calculation by transforming the previous line toward the final answer.';
}

export default function SolutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceSpeaker, setVoiceSpeaker] = useState('ritu');
  const [voicePace, setVoicePace] = useState(1.0);

  useEffect(() => {
    let mounted = true;
    getQuestionSolution(id)
      .then((solution) => {
        if (mounted) setData(solution);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Could not load the solution.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
      stopSpeech();
    };
  }, [id]);

  const voiceText = useMemo(() => {
    if (!data) return '';
    const problem = data.question?.problem_expr ? `The problem is ${mathExprToSpeech(data.question.problem_expr)}.` : '';
    const steps = (data.steps || []).map((step, index) => `Step ${index + 1}. ${mathExprToSpeech(step)}.`).join(' ');
    const answer = data.correct_answer ? `The final answer is ${mathExprToSpeech(data.correct_answer)}.` : '';
    return [data.voice_script || data.explanation, problem, steps, answer].filter(Boolean).join(' ');
  }, [data]);

  const handlePlay = () => {
    if (paused) {
      resumeSpeech();
      setSpeaking(true);
      setPaused(false);
      return;
    }
    if (!voiceText) return;
    setSpeaking(true);
    setPaused(false);
    speak(voiceText, {
      language: voiceLang,
      speaker: voiceSpeaker,
      pace: voicePace,
      onEnd: () => {
        setSpeaking(false);
        setPaused(false);
      },
      onError: () => {
        setSpeaking(false);
        setPaused(false);
      },
    });
  };

  const handlePause = () => {
    pauseSpeech();
    setSpeaking(false);
    setPaused(true);
  };

  const handleStop = () => {
    stopSpeech();
    setSpeaking(false);
    setPaused(false);
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

  if (error || !data) {
    return (
      <div className="page">
        <div className="container">
          <div className="card empty-state">
            <h3>{error || 'Solution not found'}</h3>
            <button className="btn btn-primary" onClick={() => navigate('/questions')}>Back to Workspace</button>
          </div>
        </div>
      </div>
    );
  }

  const question = data.question;

  return (
    <div className="page student-page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '28px' }}>
          <button className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={() => navigate('/questions')}>
            &larr; Back to Problems
          </button>
        </div>

        <section className="workspace-hero" style={{ padding: '50px', gridTemplateColumns: 'minmax(0, 1fr) 360px', alignItems: 'start' }}>
          <div>
            <div className="hero-kicker">Solution</div>
            <h1 className="hero-title" style={{ fontSize: '3rem' }}>{question.title}</h1>
            <div className="chip-wrap" style={{ margin: '18px 0' }}>
              <div className="badge badge-easy">{question.subject || 'Engineering Math'}</div>
              <div className="badge badge-medium">{question.topic}</div>
              <div className="badge badge-hard">{question.difficulty}</div>
            </div>
            <div className="problem solve-question-problem" style={{ fontSize: '1.25rem' }}>
              <math-field className="solve-question-field" read-only style={{ fontSize: '1.2rem', background: 'transparent', color: 'inherit', border: 'none', width: '100%' }}>
                {question.problem_expr}
              </math-field>
              {question.problem_image && (
                <img
                  src={question.problem_image}
                  alt="Expression"
                  style={{ marginTop: '16px', maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'contain', display: 'block' }}
                />
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '28px', background: 'rgba(255,255,255,0.88)' }}>
            <div className="hero-kicker" style={{ fontSize: '0.65rem', marginBottom: '14px' }}>Voice Explanation</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 0 }}>
              Listen to the walkthrough at your pace.
            </p>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
              <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} disabled={speaking} style={{ padding: '10px 12px', borderRadius: '8px' }}>
                <option value="en-IN">English (India)</option>
                <option value="ta-IN">Tamil</option>
                <option value="hi-IN">Hindi</option>
                <option value="te-IN">Telugu</option>
                <option value="kn-IN">Kannada</option>
                <option value="ml-IN">Malayalam</option>
              </select>
              <select value={voiceSpeaker} onChange={(e) => setVoiceSpeaker(e.target.value)} disabled={speaking} style={{ padding: '10px 12px', borderRadius: '8px' }}>
                <option value="ritu">Ritu</option>
                <option value="priya">Priya</option>
                <option value="rahul">Rahul</option>
                <option value="aditya">Aditya</option>
                <option value="rohan">Rohan</option>
              </select>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                Speed: {voicePace.toFixed(1)}x
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voicePace}
                  disabled={speaking}
                  onChange={(e) => setVoicePace(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '8px', accentColor: 'var(--accent-primary)' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {speaking ? (
                <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handlePause}>Pause</button>
              ) : (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handlePlay}>
                  {paused ? 'Resume' : 'Play Voice'}
                </button>
              )}
              <button className="btn btn-outline" onClick={handleStop} disabled={!speaking && !paused}>Stop</button>
            </div>
          </div>
        </section>

        <div className="solver-output-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
          <main className="solver-panel" style={{ minHeight: 'auto' }}>
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Text First</div>
                <h3 className="solver-title">Explanation</h3>
              </div>
            </div>
            <div className="solver-panel-body solution-explanation-body" style={{ padding: '30px 34px', gap: '22px', lineHeight: 1.8 }}>
              <p className="solution-explanation-copy" style={{ margin: 0 }}>{data.explanation}</p>
              {(data.steps || []).length > 0 && (
                <div className="solution-list solution-list-always-open solution-worked-list">
                  {data.steps.map((step, index) => (
                    <div key={`${index}-${step}`} className="solution-step">
                      <div className="solution-step-index">{index + 1}</div>
                      <div className="solution-step-detail solution-step-lines">
                        {splitWorkedStep(step).map((line, lineIndex) => (
                          <span className="solution-step-line-text" key={`${index}-${lineIndex}`}>
                            {line}
                          </span>
                        ))}
                        <span className="solution-step-explain">
                          {explainWorkedStep(step, index)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="solver-panel" style={{ minHeight: 'auto' }}>
            <div className="solver-panel-head">
              <div>
                <div className="solver-kicker">Final Check</div>
                <h3 className="solver-title">Answer</h3>
              </div>
            </div>
            <div className="solver-panel-body" style={{ padding: '30px 34px' }}>
              <div className="telemetry-card telemetry-card-accent">
                <div className="telemetry-card-label">Correct Answer</div>
                <div className="telemetry-mono">{data.correct_answer || 'Answer depends on the completed reasoning.'}</div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '18px', width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/solve/${id}`)}>
                Try Solving
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
