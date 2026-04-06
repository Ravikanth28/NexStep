/**
 * Converts mathematical expressions (SymPy notation or LaTeX) into
 * natural spoken English so a TTS engine pronounces them correctly.
 */

// ── SymPy string → spoken text ─────────────────────────────────────────────

export function mathExprToSpeech(expr) {
  if (!expr) return '';
  let t = String(expr);

  // LaTeX commands (when expression comes from the LaTeX editor)
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 divided by $2');
  t = t.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');
  t = t.replace(/\\sqrt/g, 'square root');
  t = t.replace(/\\int(?:_\{([^}]*)\})?\^\{([^}]*)\}/g, 'integral from $1 to $2 of');
  t = t.replace(/\\int/g, 'integral of');
  t = t.replace(/\\sum(?:_\{([^}]*)\})?\^\{([^}]*)\}/g, 'sum from $1 to $2 of');
  t = t.replace(/\\sum/g, 'sum');
  t = t.replace(/\\prod/g, 'product');
  t = t.replace(/\\lim(_\{[^}]*\})?/g, 'limit');
  t = t.replace(/\\infty/g, 'infinity');
  t = t.replace(/\\pi/g, 'pi');
  t = t.replace(/\\theta/g, 'theta');
  t = t.replace(/\\alpha/g, 'alpha');
  t = t.replace(/\\beta/g, 'beta');
  t = t.replace(/\\gamma/g, 'gamma');
  t = t.replace(/\\lambda/g, 'lambda');
  t = t.replace(/\\omega/g, 'omega');
  t = t.replace(/\\sigma/g, 'sigma');
  t = t.replace(/\\mu/g, 'mu');
  t = t.replace(/\\epsilon/g, 'epsilon');
  t = t.replace(/\\delta/g, 'delta');
  t = t.replace(/\\cdot/g, ' times ');
  t = t.replace(/\\times/g, ' times ');
  t = t.replace(/\\div/g, ' divided by ');
  t = t.replace(/\\pm/g, ' plus or minus ');
  t = t.replace(/\\mp/g, ' minus or plus ');
  t = t.replace(/\\leq/g, ' less than or equal to ');
  t = t.replace(/\\geq/g, ' greater than or equal to ');
  t = t.replace(/\\neq/g, ' not equal to ');
  t = t.replace(/\\approx/g, ' approximately equal to ');
  t = t.replace(/\\to/g, ' approaches ');
  t = t.replace(/\\rightarrow/g, ' gives ');
  t = t.replace(/\^\{([^}]+)\}/g, (_, exp) => ` to the power of ${exp}`);
  t = t.replace(/_\{([^}]+)\}/g, (_, sub) => ` subscript ${sub}`);
  t = t.replace(/\\left\(/g, '(');
  t = t.replace(/\\right\)/g, ')');
  t = t.replace(/\\left\[/g, '[');
  t = t.replace(/\\right\]/g, ']');
  t = t.replace(/\\left|\\right/g, '');
  t = t.replace(/[\\{}\[\]]/g, ' ');

  // ── SymPy / Python notation ─────────────────────────────────────────

  // Powers: x**2 → x squared / x cubed / x to the power of n
  t = t.replace(/\(([^)]+)\)\*\*2/g, 'the quantity $1, squared');
  t = t.replace(/\(([^)]+)\)\*\*3/g, 'the quantity $1, cubed');
  t = t.replace(/\(([^)]+)\)\*\*(\w+)/g, 'the quantity $1 to the power of $2');
  t = t.replace(/(\w)\*\*2/g, '$1 squared');
  t = t.replace(/(\w)\*\*3/g, '$1 cubed');
  t = t.replace(/(\w)\*\*\(([^)]+)\)/g, '$1 to the power of $2');
  t = t.replace(/(\w)\*\*(\w+)/g, '$1 to the power of $2');
  t = t.replace(/\*\*/g, ' to the power of ');

  // Functions — order matters (longer names first)
  t = t.replace(/\bsinh\b/g, 'hyperbolic sine');
  t = t.replace(/\bcosh\b/g, 'hyperbolic cosine');
  t = t.replace(/\btanh\b/g, 'hyperbolic tangent');
  t = t.replace(/\barcsin\b/g, 'arc sine');
  t = t.replace(/\barccos\b/g, 'arc cosine');
  t = t.replace(/\barctan\b/g, 'arc tangent');
  t = t.replace(/\basin\b/g, 'arc sine');
  t = t.replace(/\bacos\b/g, 'arc cosine');
  t = t.replace(/\batan\b/g, 'arc tangent');
  t = t.replace(/\bsin\b/g, 'sine');
  t = t.replace(/\bcos\b/g, 'cosine');
  t = t.replace(/\btan\b/g, 'tangent');
  t = t.replace(/\bcot\b/g, 'cotangent');
  t = t.replace(/\bsec\b/g, 'secant');
  t = t.replace(/\bcsc\b/g, 'cosecant');
  t = t.replace(/\bexp\b/g, 'e to the power');
  t = t.replace(/\bln\b/g, 'natural log');
  t = t.replace(/\blog\b/g, 'log');
  t = t.replace(/\bsqrt\b/g, 'square root of');
  t = t.replace(/\babs\b/g, 'absolute value of');
  t = t.replace(/\bDirac\b/g, 'dirac delta');
  t = t.replace(/\bHeaviside\b/g, 'Heaviside step function');
  t = t.replace(/\blaplace_transform\b/gi, 'Laplace transform');
  t = t.replace(/\binverse_laplace_transform\b/gi, 'inverse Laplace transform');
  t = t.replace(/\bfourier_series\b/gi, 'Fourier series');
  t = t.replace(/\bintegrate\s*\(/g, 'integral of (');

  // Symbols
  t = t.replace(/\bpi\b/g, 'pi');
  t = t.replace(/\boo\b/g, 'infinity');
  t = t.replace(/\bE\b/g, 'e');
  t = t.replace(/\bI\b/g, 'i');   // imaginary unit in SymPy

  // Arithmetic operators
  t = t.replace(/\*/g, ' times ');
  t = t.replace(/\//g, ' divided by ');

  // Fourier coefficient patterns: a_0, a_n, b_n
  t = t.replace(/\ba_0\b/g, 'a naught');
  t = t.replace(/\ba_n\b/g, 'a n');
  t = t.replace(/\bb_n\b/g, 'b n');

  // Clean up excess whitespace
  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

// ── Build the full spoken script after submission ──────────────────────────

export function buildExplanationScript({
  questionTitle,
  problemExpr,
  verdict,
  correctAnswer,
  solutionSteps,
  overallFeedback,
  results,
  feedback,
}) {
  const parts = [];

  // Verdict announcement
  if (verdict === 'Correct') {
    parts.push(`Excellent work. Your solution to "${questionTitle}" is correct.`);
  } else if (verdict) {
    parts.push(
      `Your solution to "${questionTitle}" was not fully correct. Let me walk you through the correct approach.`
    );
  } else {
    parts.push(`Here is the explanation for "${questionTitle}".`);
  }

  // Restate the problem
  if (problemExpr) {
    const spoken = mathExprToSpeech(problemExpr);
    parts.push(`The problem asked: ${spoken}.`);
  }

  // Correct answer
  if (correctAnswer) {
    const spoken = mathExprToSpeech(correctAnswer);
    parts.push(`The correct answer is: ${spoken}.`);
  }

  // Step-by-step solution
  if (solutionSteps && solutionSteps.length > 0) {
    parts.push(
      `Here is the complete step-by-step solution with ${solutionSteps.length} step${solutionSteps.length !== 1 ? 's' : ''}.`
    );
    solutionSteps.forEach((s) => {
      const detail = s.detail ? mathExprToSpeech(s.detail) : '';
      parts.push(`Step ${s.step}: ${s.title}. ${detail}`);
    });
  }

  // Student's wrong steps
  if (results) {
    const invalid = results.filter((r) => !r.valid);
    if (invalid.length > 0 && verdict !== 'Correct') {
      parts.push(
        `In your submission, ${invalid.length} step${invalid.length !== 1 ? 's were' : ' was'} incorrect.`
      );
      invalid.forEach((r) => {
        const expr = mathExprToSpeech(r.expression);
        const err = r.error || 'This step could not be verified.';
        parts.push(`Line ${r.step}, ${expr}, was invalid. ${err}`);
      });
    }
  }

  // Overall feedback
  if (overallFeedback) {
    parts.push(`Overall feedback: ${overallFeedback}`);
  }

  // AI feedback summary
  if (feedback && feedback.summary) {
    parts.push(feedback.summary);
  }

  return parts.join('  ');
}

// ── Spoken text → LaTeX converter (for STT input) ────────────────────────

export function speechToLatex(text) {
  if (!text) return text;
  let t = String(text).trim();

  // Strip trailing punctuation STT engines append (period, comma, etc.)
  t = t.replace(/[.,;:!?]+$/, '').trim();

  // ── Multi-word fractions ─────────────────────────────────────────────────
  t = t.replace(/\bfraction\s+(\S+)\s+over\s+(\S+)/gi, '\\frac{$1}{$2}');
  t = t.replace(/\bone\s+half\b/gi, '\\frac{1}{2}');
  t = t.replace(/\bone\s+third\b/gi, '\\frac{1}{3}');
  t = t.replace(/\bone\s+(?:fourth|quarter)\b/gi, '\\frac{1}{4}');
  t = t.replace(/\b(\w+)\s+over\s+(\w+)\b/gi, '\\frac{$1}{$2}');

  // ── Subscripts ───────────────────────────────────────────────────────────
  t = t.replace(/\b(\w)\s+sub(?:script)?\s+(\w+)\b/gi, '$1_{$2}');
  t = t.replace(/\ba\s+naught\b|\ba\s+not\b|\ba\s+zero\b/gi, 'a_{0}');
  t = t.replace(/\ba\s+sub\s+zero\b|\ba\s+0\b/gi, 'a_{0}');
  t = t.replace(/\ba\s+n\b/gi, 'a_{n}');
  t = t.replace(/\bb\s+n\b/gi, 'b_{n}');

  // ── Powers ───────────────────────────────────────────────────────────────
  t = t.replace(/\b(\w+)\s+to\s+the\s+power\s+of\s+(\w+)/gi, '$1^{$2}');
  t = t.replace(/\b(\w+)\s+to\s+the\s+(\w+)\s+power\b/gi, '$1^{$2}');
  t = t.replace(/\b(\w+)\s+squared\b/gi, '$1^{2}');
  t = t.replace(/\b(\w+)\s+cubed\b/gi, '$1^{3}');

  // ── Calculus ─────────────────────────────────────────────────────────────
  t = t.replace(/\bintegral\s+from\s+(\S+)\s+to\s+(\S+)\s+of\b/gi, '\\int_{$1}^{$2}');
  t = t.replace(/\bintegral\s+of\b/gi, '\\int');
  t = t.replace(/\bintegral\b/gi, '\\int');
  t = t.replace(/\bint\b/gi, '\\int');
  t = t.replace(/\bderivative\s+of\b|\bd\s*d\s*x\b/gi, '\\frac{d}{dx}');
  t = t.replace(/\bpartial\s+derivative\b/gi, '\\partial');
  t = t.replace(/\bpartial\b/gi, '\\partial');
  t = t.replace(/\blimit\s+as\s+(\S+)\s+approaches\s+(\S+)/gi, '\\lim_{$1 \\to $2}');
  t = t.replace(/\blimit\b/gi, '\\lim');
  t = t.replace(/\blim\b/gi, '\\lim');
  t = t.replace(/\bsum\s+from\s+(\S+)\s+to\s+(\S+)\s+of\b/gi, '\\sum_{$1}^{$2}');
  t = t.replace(/\bsummation\b/gi, '\\sum');
  t = t.replace(/\bsum\b/gi, '\\sum');
  t = t.replace(/\bproduct\b|\bprod\b/gi, '\\prod');
  t = t.replace(/\bd\s+x\b/gi, 'dx');
  t = t.replace(/\bd\s+t\b/gi, 'dt');

  // ── Trig (full words AND abbreviations) ──────────────────────────────────
  t = t.replace(/\bhyperbolic\s+sine\b|\bsinh\b/gi, '\\sinh');
  t = t.replace(/\bhyperbolic\s+cosine\b|\bcosh\b/gi, '\\cosh');
  t = t.replace(/\bhyperbolic\s+tangent\b|\btanh\b/gi, '\\tanh');
  t = t.replace(/\barc\s*sine\b|\barcsin\b/gi, '\\arcsin');
  t = t.replace(/\barc\s*cosine\b|\barccos\b/gi, '\\arccos');
  t = t.replace(/\barc\s*tangent\b|\barctan\b/gi, '\\arctan');
  t = t.replace(/\bsine\b|\bsin\b/gi, '\\sin');
  t = t.replace(/\bcosine\b|\bcos\b/gi, '\\cos');
  t = t.replace(/\btangent\b|\btan\b/gi, '\\tan');
  t = t.replace(/\bcotangent\b|\bcot\b/gi, '\\cot');
  t = t.replace(/\bsecant\b|\bsec\b/gi, '\\sec');
  t = t.replace(/\bcosecant\b|\bcsc\b/gi, '\\csc');

  // ── Logs ─────────────────────────────────────────────────────────────────
  t = t.replace(/\bnatural\s+log(?:arithm)?\b/gi, '\\ln');
  t = t.replace(/\bln\b/gi, '\\ln');
  t = t.replace(/\blog(?:arithm)?\b/gi, '\\log');

  // ── Exponential ──────────────────────────────────────────────────────────
  t = t.replace(/\be\s+to\s+the\s+power\s+of\s+(\S+)/gi, 'e^{$1}');
  t = t.replace(/\be\s+to\s+the\s+(\S+)/gi, 'e^{$1}');
  t = t.replace(/\bexponential\b|\bexp\b/gi, 'e^{}');

  // ── Greek letters ────────────────────────────────────────────────────────
  t = t.replace(/\balpha\b/gi, '\\alpha');
  t = t.replace(/\bbeta\b/gi, '\\beta');
  t = t.replace(/\bgamma\b/gi, '\\gamma');
  t = t.replace(/\bdelta\b/gi, '\\delta');
  t = t.replace(/\bepsilon\b/gi, '\\epsilon');
  t = t.replace(/\btheta\b/gi, '\\theta');
  t = t.replace(/\blambda\b/gi, '\\lambda');
  t = t.replace(/\bmu\b/gi, '\\mu');
  t = t.replace(/\bsigma\b/gi, '\\sigma');
  t = t.replace(/\bomega\b/gi, '\\omega');
  t = t.replace(/\bphi\b/gi, '\\phi');
  t = t.replace(/\bpsi\b/gi, '\\psi');
  t = t.replace(/\bpi\b/gi, '\\pi');
  t = t.replace(/\brho\b/gi, '\\rho');
  t = t.replace(/\beta\b/gi, '\\eta');
  t = t.replace(/\bzeta\b/gi, '\\zeta');
  t = t.replace(/\bxi\b/gi, '\\xi');
  t = t.replace(/\bchi\b/gi, '\\chi');
  t = t.replace(/\btau\b/gi, '\\tau');
  t = t.replace(/\bnu\b/gi, '\\nu');
  t = t.replace(/\bkappa\b/gi, '\\kappa');

  // ── Constants & symbols ──────────────────────────────────────────────────
  t = t.replace(/\binfinity\b|\binf\b/gi, '\\infty');
  t = t.replace(/\bplus\s+or\s+minus\b/gi, '\\pm');
  t = t.replace(/\btimes\b/gi, '\\times');
  t = t.replace(/\bdivided\s+by\b/gi, '\\div');
  t = t.replace(/\bless\s+than\s+or\s+equal\s+to\b/gi, '\\leq');
  t = t.replace(/\bgreater\s+than\s+or\s+equal\s+to\b/gi, '\\geq');
  t = t.replace(/\bnot\s+equal\s+to\b/gi, '\\neq');
  t = t.replace(/\bapproximately(?:\s+equal(?:\s+to)?)?\b/gi, '\\approx');
  t = t.replace(/\bapproaches\b|\barrow\b/gi, '\\to');
  t = t.replace(/\bless\s+than\b/gi, '<');
  t = t.replace(/\bgreater\s+than\b/gi, '>');
  t = t.replace(/\bequals\b|\bequal\s+to\b/gi, '=');
  t = t.replace(/\bplus\b/gi, '+');
  t = t.replace(/\bminus\b/gi, '-');
  t = t.replace(/\bdot\b|\bcdot\b/gi, '\\cdot');
  t = t.replace(/\bopen\s+(?:paren(?:thesis)?|bracket)\b/gi, '(');
  t = t.replace(/\bclose\s+(?:paren(?:thesis)?|bracket)\b/gi, ')');
  t = t.replace(/\bopen\s+curly\b/gi, '\\{');
  t = t.replace(/\bclose\s+curly\b/gi, '\\}');

  // ── Roots (LAST — so the argument already has \sin, \pi etc. converted) ──
  // "square root of ...", "sqrt of ...", "root of ..." → \sqrt{...}
  // Use (.+) to capture the whole remaining argument including multi-word.
  t = t.replace(/\bsquare\s+root\s+of\s+(.+)/gi, '\\sqrt{$1}');
  t = t.replace(/\bsqrt\s+of\s+(.+)/gi, '\\sqrt{$1}');
  t = t.replace(/\bcube\s+root\s+of\s+(.+)/gi, '\\sqrt[3]{$1}');
  // bare "root of ..." — STT often drops the word "square"
  t = t.replace(/\broot\s+of\s+(.+)/gi, '\\sqrt{$1}');
  // standalone without argument
  t = t.replace(/\bsquare\s+root\b/gi, '\\sqrt{}');
  t = t.replace(/\bsqrt\b/gi, '\\sqrt{}');
  t = t.replace(/\bcube\s+root\b/gi, '\\sqrt[3]{}');
  t = t.replace(/\broot\b/gi, '\\sqrt{}');

  // Clean up excess whitespace
  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

// ── Sarvam AI TTS helpers ──────────────────────────────────────────────────

// Internal state for the active audio source so we can stop/pause/resume it.
let _audioCtx = null;
let _sourceNode = null;
let _pauseOffset = 0;
let _startTime = 0;
let _audioBuffer = null;
let _onEndCallback = null;
let _isSarvamPaused = false;
// Cancellation flag for speakSegments chains
let _segmentsCancelled = false;

function _getAudioContext() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function _playBuffer(buffer, offset, onEnd) {
  const ctx = _getAudioContext();
  if (_sourceNode) {
    try { _sourceNode.disconnect(); } catch (_) {}
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.onended = () => {
    if (!_isSarvamPaused && onEnd) onEnd();
  };
  source.start(0, offset);
  _sourceNode = source;
  _startTime = ctx.currentTime - offset;
}

// Stops audio playback without touching the segment chain cancellation flag.
function _stopAudioOnly() {
  _isSarvamPaused = false;
  _pauseOffset = 0;
  _audioBuffer = null;
  if (_sourceNode) {
    try { _sourceNode.onended = null; _sourceNode.stop(); _sourceNode.disconnect(); } catch (_) {}
    _sourceNode = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Speak text via Sarvam AI TTS (bulbul:v3).
 * Falls back to browser speechSynthesis if the API call fails.
 */
export async function speak(text, { onStart, onEnd, onError, pace = 1.0, language = 'en-IN', speaker = 'ritu' } = {}) {
  // Stop any existing audio (but don't cancel a running segment chain)
  _stopAudioOnly();
  _isSarvamPaused = false;
  _pauseOffset = 0;
  _onEndCallback = onEnd || null;

  if (onStart) onStart();

  try {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, pace, language, speaker }),
    });

    if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);

    const { audio_b64 } = await res.json();

    // Decode base64 WAV → ArrayBuffer → AudioBuffer
    const binaryStr = atob(audio_b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const ctx = _getAudioContext();
    _audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    _playBuffer(_audioBuffer, 0, _onEndCallback);
  } catch (err) {
    console.warn('Sarvam TTS failed, falling back to browser speech:', err);
    if (onError) onError(err);
    // Fallback to browser speechSynthesis
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeech() {
  _segmentsCancelled = true;  // cancel any running segment chain
  _stopAudioOnly();
}

export function pauseSpeech() {
  if (_sourceNode && _audioCtx && !_isSarvamPaused) {
    _pauseOffset = _audioCtx.currentTime - _startTime;
    _isSarvamPaused = true;
    try { _sourceNode.onended = null; _sourceNode.stop(); } catch (_) {}
    _sourceNode = null;
  } else if (window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (_isSarvamPaused && _audioBuffer) {
    _isSarvamPaused = false;
    _playBuffer(_audioBuffer, _pauseOffset, _onEndCallback);
  } else if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

// ── Segment-based explanation builder ─────────────────────────────────────

/**
 * Build the explanation as an ordered array of segments.
 * Each segment has { text: string, stepIndex: number|null }.
 * stepIndex is the 1-based solution step number, or null for non-step narration.
 */
export function buildExplanationSegments({
  questionTitle,
  problemExpr,
  verdict,
  correctAnswer,
  solutionSteps,
  overallFeedback,
  results,
  feedback,
}) {
  const segments = [];

  if (verdict === 'Correct') {
    segments.push({ text: `Excellent work. Your solution to "${questionTitle}" is correct.`, stepIndex: null });
  } else if (verdict) {
    segments.push({ text: `Your solution to "${questionTitle}" was not fully correct. Let me walk you through the correct approach.`, stepIndex: null });
  } else {
    segments.push({ text: `Here is the explanation for "${questionTitle}".`, stepIndex: null });
  }

  if (problemExpr) {
    segments.push({ text: `The problem asked: ${mathExprToSpeech(problemExpr)}.`, stepIndex: null });
  }

  if (correctAnswer) {
    segments.push({ text: `The correct answer is: ${mathExprToSpeech(correctAnswer)}.`, stepIndex: null });
  }

  if (solutionSteps && solutionSteps.length > 0) {
    segments.push({
      text: `Here is the complete step-by-step solution with ${solutionSteps.length} step${solutionSteps.length !== 1 ? 's' : ''}.`,
      stepIndex: null,
    });
    solutionSteps.forEach((s) => {
      const detail = s.detail ? mathExprToSpeech(s.detail) : '';
      segments.push({
        text: `Step ${s.step}: ${s.title}. ${detail}`.trim(),
        stepIndex: s.step,   // 1-based, matches s.step in the UI
      });
    });
  }

  if (results) {
    const invalid = results.filter((r) => !r.valid);
    if (invalid.length > 0 && verdict !== 'Correct') {
      segments.push({
        text: `In your submission, ${invalid.length} step${invalid.length !== 1 ? 's were' : ' was'} incorrect.`,
        stepIndex: null,
      });
      invalid.forEach((r) => {
        const expr = mathExprToSpeech(r.expression);
        const err = r.error || 'This step could not be verified.';
        segments.push({ text: `Line ${r.step}, ${expr}, was invalid. ${err}`, stepIndex: null });
      });
    }
  }

  if (overallFeedback) {
    segments.push({ text: `Overall feedback: ${overallFeedback}`, stepIndex: null });
  }

  if (feedback && feedback.summary) {
    segments.push({ text: feedback.summary, stepIndex: null });
  }

  return segments;
}

/**
 * Speak an array of segments sequentially.
 * Calls onStepChange(stepIndex) before each segment so the UI can highlight the active step.
 * Pause/resume/stop all work correctly via the shared module-level audio state.
 */
export async function speakSegments(
  segments,
  { onStepChange, onStart, onEnd, onError, language = 'en-IN', speaker = 'ritu', pace = 1.0 } = {},
) {
  if (!segments || segments.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  _segmentsCancelled = false;
  let idx = 0;

  if (onStart) onStart();

  const playNext = async () => {
    if (_segmentsCancelled || idx >= segments.length) {
      if (!_segmentsCancelled && onEnd) onEnd();
      return;
    }
    const seg = segments[idx];
    idx++;
    if (onStepChange) onStepChange(seg.stepIndex);
    await speak(seg.text, {
      language,
      speaker,
      pace,
      onEnd: playNext,
      onError: () => {
        // on error in a segment, keep going to the next one
        if (onError) onError();
        playNext();
      },
    });
  };

  await playNext();
}
