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
    { label: '[ ]', insert: '\\begin{pmatrix}\\end{pmatrix}' },
    { label: 'det', insert: '\\det' },
    { label: 'A⁻¹', insert: '^{-1}' },
    { label: 'Aᵀ', insert: '^{T}' },
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

  return (
    <div className="math-keyboard">
      <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Notation Center</div>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>Fast Symbolic Tools</h3>
      </div>

      <div className="keyboard-tabs" style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-main)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
            type="button"
            style={{ 
              background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab ? 'var(--bg-darker)' : 'var(--text-secondary)',
              border: 'none',
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

      <div className="keyboard-keys" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
        {SYMBOLS[activeTab].map((sym, idx) => (
          <button
            key={idx}
            className="key-btn"
            onClick={(e) => { e.preventDefault(); onInsert(sym.insert); }}
            type="button"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              padding: '10px 4px',
              color: 'white',
              fontSize: '0.85rem',
              fontFamily: 'JetBrains Mono',
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
