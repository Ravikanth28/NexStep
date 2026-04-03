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

// ── Speech synthesis helpers ───────────────────────────────────────────────

export function speak(text, { onStart, onEnd, onError, rate = 0.92, pitch = 1.0 } = {}) {
  if (!window.speechSynthesis) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = 'en-US';

  // Prefer a clear English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (preferred) utterance.voice = preferred;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function pauseSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.pause();
}

export function resumeSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.resume();
}
