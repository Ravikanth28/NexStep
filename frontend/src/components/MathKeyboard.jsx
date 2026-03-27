import { useState } from 'react';

const TABS = ['Basic', 'Calculus', 'Matrices', 'Transforms', 'Stats', 'Greek', 'Trig'];

const SYMBOLS = {
  Basic: [
    { label: 'x^2', insert: 'x^2' },
    { label: 'x^n', insert: '^' },
    { label: 'sqrt(x)', insert: 'sqrt(' },
    { label: 'pi', insert: 'pi' },
    { label: 'e', insert: 'e' },
    { label: 'infinity', insert: 'oo' },
    { label: '+', insert: ' + ' },
    { label: '-', insert: ' - ' },
    { label: '*', insert: ' * ' },
    { label: '/', insert: ' / ' },
    { label: '=', insert: ' = ' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '|x|', insert: 'abs(' },
    { label: 'log', insert: 'log(' },
    { label: 'ln', insert: 'ln(' },
  ],
  Calculus: [
    { label: '∫', insert: '∫ ' },
    { label: '∫(a,b)', insert: '∫(a,b) ', selectStart: 2, selectEnd: 3 },
    { label: '∬', insert: '∬ ' },
    { label: '∭', insert: '∭ ' },
    { label: 'd/dx', insert: 'd/dx ' },
    { label: '∂', insert: '∂' },
    { label: '∇', insert: '∇' },
    { label: 'lim', insert: 'lim(' },
    { label: 'sum', insert: 'sum(' },
    { label: 'prod', insert: 'prod(' },
    { label: '+ C', insert: ' + C' },
    { label: 'dx', insert: ' dx' },
    { label: 'dy', insert: ' dy' },
    { label: 'dz', insert: ' dz' },
  ],
  Matrices: [
    { label: '[ ]', insert: '[ ]' },
    { label: '[[ ]]', insert: '[[ ]]' },
    { label: 'det(A)', insert: 'det(' },
    { label: 'A^-1', insert: '^(-1)' },
    { label: 'A^T', insert: '^T' },
    { label: 'I (eye)', insert: 'eye(' },
    { label: 'λ (eig)', insert: 'eigvals(' },
    { label: 'Rank', insert: 'rank(' },
    { label: 'Dot', insert: 'dot(' },
    { label: 'Cross', insert: 'cross(' },
  ],
  Transforms: [
    { label: 'ℒ (Laplace)', insert: 'laplace_transform(' },
    { label: 'ℒ^-1', insert: 'inverse_laplace_transform(' },
    { label: 'ℱ (Fourier)', insert: 'fourier_transform(' },
    { label: '𝒵 (Z)', insert: 'z_transform(' },
    { label: 'grad', insert: 'Gradient(' },
    { label: 'div', insert: 'Divergence(' },
    { label: 'curl', insert: 'Curl(' },
    { label: 'δ(t)', insert: 'DiracDelta(' },
    { label: 'u(t)', insert: 'Heaviside(' },
  ],
  Stats: [
    { label: 'μ (mu)', insert: 'mu' },
    { label: 'σ (sigma)', insert: 'sigma' },
    { label: 'σ^2', insert: 'sigma^2' },
    { label: 'χ^2', insert: 'chi_square' },
    { label: 'P(X)', insert: 'P(' },
    { label: 'E(X)', insert: 'E(' },
    { label: 'Var(X)', insert: 'Var(' },
    { label: 'Normal', insert: 'Normal(' },
    { label: 'std', insert: 'std(' },
  ],
  Greek: [
    { label: 'α', insert: 'alpha' },
    { label: 'β', insert: 'beta' },
    { label: 'γ', insert: 'gamma' },
    { label: 'δ', insert: 'delta' },
    { label: 'ε', insert: 'epsilon' },
    { label: 'λ', insert: 'lambda' },
    { label: 'θ', insert: 'theta' },
    { label: 'μ', insert: 'mu' },
    { label: 'ρ', insert: 'rho' },
    { label: 'ω', insert: 'omega' },
    { label: 'Δ', insert: 'Delta' },
    { label: 'Σ', insert: 'Sigma' },
    { label: 'Ω', insert: 'Omega' },
  ],
  Trig: [
    { label: 'sin', insert: 'sin(' },
    { label: 'cos', insert: 'cos(' },
    { label: 'tan', insert: 'tan(' },
    { label: 'sec', insert: 'sec(' },
    { label: 'csc', insert: 'csc(' },
    { label: 'cot', insert: 'cot(' },
    { label: 'sinh', insert: 'sinh(' },
    { label: 'cosh', insert: 'cosh(' },
    { label: 'tanh', insert: 'tanh(' },
    { label: 'asin', insert: 'asin(' },
    { label: 'acos', insert: 'acos(' },
    { label: 'atan', insert: 'atan(' },
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

      <div className="keyboard-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="keyboard-keys" style={{ padding: '16px' }}>
        {SYMBOLS[activeTab].map((sym, idx) => (
          <button
            key={idx}
            className="key-btn"
            onClick={() => onInsert(sym.insert, sym.selectStart, sym.selectEnd)}
            type="button"
            title={sym.label}
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
}
