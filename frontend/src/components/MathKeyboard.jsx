import { useState } from 'react';

const TABS = ['Basic', 'Calculus', 'Matrices', 'Transforms', 'Stats', 'Greek', 'Trig'];

const SYMBOLS = {
  Basic: [
    { label: 'x²', insert: '^2' },
    { label: 'xⁿ', insert: '^{}' },
    { label: '√x', insert: '\\sqrt{}' },
    { label: 'π', insert: '\\pi' },
    { label: 'e', insert: 'e' },
    { label: '∞', insert: '\\infty' },
    { label: '+', insert: '+' },
    { label: '-', insert: '-' },
    { label: '×', insert: '\\times' },
    { label: '÷', insert: '\\div' },
    { label: '=', insert: '=' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '|x|', insert: '|' },
    { label: '→', insert: '\\to ' },
    { label: '⇒', insert: '\\Rightarrow ' },
    { label: '≠', insert: '\\neq ' },
    { label: '≤', insert: '\\leq ' },
    { label: '≥', insert: '\\geq ' },
    { label: 'log', insert: '\\log' },
    { label: 'ln', insert: '\\ln' },
  ],
  Calculus: [
    { label: '∫', insert: '\\int' },
    { label: '∫(a,b)', insert: '\\int_{a}^{b}' },
    { label: '∬', insert: '\\iint' },
    { label: '∭', insert: '\\iiint' },
    { label: 'd/dx', insert: '\\frac{d}{dx}' },
    { label: '∂', insert: '\\partial' },
    { label: '∇', insert: '\\nabla' },
    { label: 'lim', insert: '\\lim_{}' },
    { label: 'x→a', insert: '\\lim_{x \\to }' },
    { label: '→', insert: '\\to ' },
    { label: '→∞', insert: '\\to \\infty' },
    { label: 'Σ', insert: '\\sum' },
    { label: 'Σ(a,b)', insert: '\\sum_{n=0}^{\\infty}' },
    { label: '∏', insert: '\\prod_{}^{}' },
    { label: '+C', insert: '+C' },
    { label: 'dx', insert: 'dx' },
    { label: 'dy', insert: 'dy' },
    { label: 'dz', insert: 'dz' },
  ],
  Matrices: [
    { label: '1×2', insert: '\\begin{pmatrix} a & b \\end{pmatrix}' },
    { label: '2×1', insert: '\\begin{pmatrix} a \\\\ b \\end{pmatrix}' },
    { label: '2×2', insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: '2×3', insert: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\end{pmatrix}' },
    { label: '3×3', insert: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
    { label: '[ ]ᵀ', insert: '^{T}' },
    { label: '[ ]⁻¹', insert: '^{-1}' },
    { label: 'det', insert: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'I', insert: 'I' },
    { label: 'λ', insert: '\\lambda' },
    { label: 'Rank', insert: '\\operatorname{rank}' },
    { label: 'Dot', insert: '\\cdot' },
    { label: 'Cross', insert: '\\times' },
  ],
  Transforms: [
    { label: 'ℒ', insert: '\\mathcal{L}' },
    { label: 'ℒ⁻¹', insert: '\\mathcal{L}^{-1}' },
    { label: 'ℱ', insert: '\\mathcal{F}' },
    { label: '𝒵', insert: '\\mathcal{Z}' },
    { label: 'a₀', insert: 'a_0' },
    { label: 'aₙ', insert: 'a_n' },
    { label: 'bₙ', insert: 'b_n' },
    { label: 'f(x)', insert: 'f(x)' },
    { label: 'cos nx', insert: '\\cos nx' },
    { label: 'sin nx', insert: '\\sin nx' },
    { label: 'grad', insert: '\\nabla' },
    { label: 'div', insert: '\\nabla\\cdot' },
    { label: 'curl', insert: '\\nabla\\times' },
    { label: 'δ(t)', insert: '\\delta(t)' },
    { label: 'u(t)', insert: 'u(t)' },
  ],
  Stats: [
    { label: 'μ', insert: '\\mu' },
    { label: 'σ', insert: '\\sigma' },
    { label: 'σ²', insert: '\\sigma^{2}' },
    { label: 'χ²', insert: '\\chi^{2}' },
    { label: 'P(X)', insert: 'P(X)' },
    { label: 'E(X)', insert: 'E(X)' },
    { label: 'Var', insert: '\\operatorname{Var}' },
    { label: 'std', insert: '\\operatorname{std}' },
  ],
  Greek: [
    { label: 'α', insert: '\\alpha' },
    { label: 'β', insert: '\\beta' },
    { label: 'γ', insert: '\\gamma' },
    { label: 'δ', insert: '\\delta' },
    { label: 'ε', insert: '\\epsilon' },
    { label: 'λ', insert: '\\lambda' },
    { label: 'θ', insert: '\\theta' },
    { label: 'μ', insert: '\\mu' },
    { label: 'ρ', insert: '\\rho' },
    { label: 'ω', insert: '\\omega' },
    { label: 'Δ', insert: '\\Delta' },
    { label: 'Σ', insert: '\\Sigma' },
    { label: 'Ω', insert: '\\Omega' },
  ],
  Trig: [
    { label: 'sin', insert: '\\sin' },
    { label: 'cos', insert: '\\cos' },
    { label: 'tan', insert: '\\tan' },
    { label: 'sec', insert: '\\sec' },
    { label: 'csc', insert: '\\csc' },
    { label: 'cot', insert: '\\cot' },
    { label: 'sinh', insert: '\\sinh' },
    { label: 'cosh', insert: '\\cosh' },
    { label: 'tanh', insert: '\\tanh' },
    { label: 'asin', insert: '\\arcsin' },
    { label: 'acos', insert: '\\arccos' },
    { label: 'atan', insert: '\\arctan' },
  ],
};

export default function MathKeyboard({ onInsert }) {
  const [activeTab, setActiveTab] = useState('Basic');
  const [matrixRows, setMatrixRows] = useState(2);
  const [matrixCols, setMatrixCols] = useState(2);
  const [lowerLimit, setLowerLimit] = useState('0');
  const [upperLimit, setUpperLimit] = useState('\\infty');
  const [fourierInterval, setFourierInterval] = useState('0_2pi');  // '0_2pi' | 'neg_pi_pi'

  const FOURIER_CONFIGS = {
    '0_2pi':    { lower: '0',     upper: '2\\pi',  label: '(0, 2π)' },
    'neg_pi_pi':{ lower: '-\\pi', upper: '\\pi',   label: '(-π, π)' },
  };

  const fi = FOURIER_CONFIGS[fourierInterval];

  const buildCustomMatrix = (e) => {
    e.preventDefault();
    const r = Math.max(1, Math.min(6, matrixRows));
    const c = Math.max(1, Math.min(6, matrixCols));
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const rows = Array.from({ length: r }, (_, ri) =>
      Array.from({ length: c }, (_, ci) => letters[(ri * c + ci) % 26]).join(' & ')
    );
    const latex = `\\begin{pmatrix} ${rows.join(' \\\\\\ ')} \\end{pmatrix}`;
    onInsert(latex);
  };

  return (
    <div className="math-keyboard">
      <div style={{ padding: '20px 24px', background: 'rgba(240,246,255,0.70)', borderBottom: '1px solid rgba(46,60,181,0.12)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Notation Center</div>
        <h3 style={{ fontSize: '1rem', margin: 0, color: '#0a1628' }}>Fast Symbolic Tools</h3>
      </div>

      <div className="keyboard-tabs" style={{ padding: '8px 24px', background: 'rgba(240,246,255,0.60)', borderBottom: '1px solid rgba(46,60,181,0.12)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
            type="button"
            style={{ 
              background: activeTab === tab ? 'var(--accent-primary)' : 'rgba(255,255,255,0.80)',
              color: activeTab === tab ? 'white' : '#3a4a6b',
              border: activeTab === tab ? 'none' : '1px solid rgba(46,60,181,0.20)',
              padding: '6px 16px',
              borderRadius: '99px',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'Transforms' && (
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(46,60,181,0.12)', background: 'rgba(240,246,255,0.60)' }}>
          <div style={{ fontSize: '0.62rem', color: '#2e3cb5', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '8px' }}>FOURIER COEFFICIENTS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Interval:</label>
            <select
              value={fourierInterval}
              onChange={(e) => setFourierInterval(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'white', border: '1px solid rgba(46,60,181,0.25)', color: '#0a1628', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              <option value="0_2pi" style={{ background: '#0e1628', color: 'white' }}>(0, 2π)</option>
              <option value="neg_pi_pi" style={{ background: '#0e1628', color: 'white' }}>(-π, π)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`a_0 = \\frac{1}{\\pi}\\int_{${fi.lower}}^{${fi.upper}} f(x)\\,dx`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(46,60,181,0.35)', background: 'rgba(46,60,181,0.08)', color: '#2e3cb5', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >a₀</button>
            <button type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`a_n = \\frac{1}{\\pi}\\int_{${fi.lower}}^{${fi.upper}} f(x)\\cos nx\\,dx`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(46,60,181,0.35)', background: 'rgba(46,60,181,0.08)', color: '#2e3cb5', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >aₙ</button>
            <button type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`b_n = \\frac{1}{\\pi}\\int_{${fi.lower}}^{${fi.upper}} f(x)\\sin nx\\,dx`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(46,60,181,0.35)', background: 'rgba(46,60,181,0.08)', color: '#2e3cb5', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >bₙ</button>
            <button type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} a_n \\cos nx + \\sum_{n=1}^{\\infty} b_n \\sin nx`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(46,60,181,0.25)', background: 'rgba(46,60,181,0.05)', color: '#2e3cb5', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >f(x) series</button>
            <button type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`\\int u\\,dv = uv - u'v_1 + u''v_2 - u'''v_3 + \\cdots`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(46,60,181,0.35)', background: 'rgba(46,60,181,0.08)', color: '#2e3cb5', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >Bernoulli ∫</button>
          </div>
        </div>
      )}

      {activeTab === 'Calculus' && (
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(46,60,181,0.12)', background: 'rgba(240,246,255,0.60)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '8px' }}>CUSTOM LIMITS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Lower</label>
              <input
                type="text"
                value={lowerLimit}
                onChange={(e) => setLowerLimit(e.target.value)}
                placeholder="0"
                style={{ width: '56px', padding: '4px 8px', borderRadius: '6px', background: 'white', border: '1px solid rgba(46,60,181,0.25)', color: '#0a1628', fontSize: '0.85rem', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Upper</label>
              <input
                type="text"
                value={upperLimit}
                onChange={(e) => setUpperLimit(e.target.value)}
                placeholder="\infty"
                style={{ width: '56px', padding: '4px 8px', borderRadius: '6px', background: 'white', border: '1px solid rgba(46,60,181,0.25)', color: '#0a1628', fontSize: '0.85rem', textAlign: 'center' }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`\\int_{${lowerLimit}}^{${upperLimit}}`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--accent-primary)', background: 'rgba(94,160,255,0.12)', color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ∫ Insert
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`\\left[\\right]_{${lowerLimit}}^{${upperLimit}}`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #f0a500', background: 'rgba(240,165,0,0.10)', color: '#f0a500', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              [ ]ₐᵇ
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`\\sum_{n=${lowerLimit}}^{${upperLimit}}`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--accent-secondary)', background: 'rgba(160,94,255,0.12)', color: 'var(--accent-secondary)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Σ Insert
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onInsert(`\\lim_{x \\to ${lowerLimit}}`); }}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--accent-success)', background: 'rgba(0,229,190,0.08)', color: 'var(--accent-success)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              lim Insert
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Matrices' && (
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(46,60,181,0.12)', background: 'rgba(240,246,255,0.60)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '8px' }}>CUSTOM MATRIX SIZE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Rows (lower)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={matrixRows}
                onChange={(e) => setMatrixRows(Number(e.target.value))}
                style={{ width: '48px', padding: '4px 8px', borderRadius: '6px', background: 'white', border: '1px solid rgba(46,60,181,0.25)', color: '#0a1628', fontSize: '0.85rem', textAlign: 'center' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Cols (upper)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={matrixCols}
                onChange={(e) => setMatrixCols(Number(e.target.value))}
                style={{ width: '48px', padding: '4px 8px', borderRadius: '6px', background: 'white', border: '1px solid rgba(46,60,181,0.25)', color: '#0a1628', fontSize: '0.85rem', textAlign: 'center' }}
              />
            </div>
            <button
              type="button"
              onClick={buildCustomMatrix}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: '1px solid var(--accent-primary)',
                background: 'rgba(94,160,255,0.12)',
                color: 'var(--accent-primary)',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Insert {matrixRows}×{matrixCols}
            </button>
          </div>
        </div>
      )}

      <div className="keyboard-keys" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
        {SYMBOLS[activeTab].map((sym, idx) => (
          <button
            key={idx}
            className="key-btn"
            onClick={(e) => { e.preventDefault(); onInsert(sym.insert); }}
            type="button"
            style={{ 
              background: 'white',
              border: '1px solid rgba(46,60,181,0.30)',
              borderRadius: '8px',
              padding: '10px 4px',
              color: '#1e293b',
              fontSize: '0.85rem',
              fontFamily: 'JetBrains Mono',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px'
            }}
            title={sym.label}
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
}
