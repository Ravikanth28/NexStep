import { useState } from 'react';

const TABS = ['Basic', 'Calculus', 'Matrices', 'Trans/Vec', 'Stats', 'Greek', 'Trig'];

const SYMBOLS = {
  Basic: [
    { label: 'x²', insert: 'x^2' }, { label: 'xⁿ', insert: '^' }, { label: '√x', insert: 'sqrt(' },
    { label: 'π', insert: 'pi' }, { label: 'e', insert: 'e' }, { label: '∞', insert: 'oo' },
    { label: '+', insert: ' + ' }, { label: '-', insert: ' - ' }, { label: '×', insert: ' * ' },
    { label: '÷', insert: ' / ' }, { label: '=', insert: ' = ' }, { label: '(', insert: '(' },
    { label: ')', insert: ')' }, { label: '|x|', insert: 'abs(' }, { label: 'log', insert: 'log(' },
    { label: 'ln', insert: 'ln(' },
  ],
  Calculus: [
    { label: '∫', insert: '∫' }, { label: 'd/dx', insert: 'd/dx ' }, { label: '∂', insert: '∂' },
    { label: 'lim', insert: 'lim(' }, { label: '∑', insert: 'sum(' }, { label: '∏', insert: 'prod(' },
    { label: '+ C', insert: ' + C' }, { label: 'dx', insert: ' dx' },
  ],
  Matrices: [
    { label: '[ ]', insert: '[ ]' }, { label: '[[ ]]', insert: '[[ ]]' }, { label: '|A|', insert: 'det(' },
    { label: 'A⁻¹', insert: '^(-1)' }, { label: 'Aᵀ', insert: '^T' }, { label: 'I', insert: 'eye(' },
    { label: 'O', insert: 'zeros(' }, { label: 'rank', insert: 'rank(' },
  ],
  'Trans/Vec': [
    { label: 'ℒ', insert: 'laplace_transform(' }, { label: 'ℒ⁻¹', insert: 'inverse_laplace_transform(' },
    { label: 'ℱ', insert: 'fourier_transform(' }, { label: '𝒵', insert: 'z_transform(' },
    { label: '∇', insert: 'Gradient(' }, { label: '∇·', insert: 'Divergence(' }, { label: '∇×', insert: 'Curl(' },
    { label: 'δ(t)', insert: 'DiracDelta(' }, { label: 'u(t)', insert: 'Heaviside(' },
  ],
  Stats: [
    { label: 'μ', insert: 'mu' }, { label: 'σ', insert: 'sigma' }, { label: 'σ²', insert: 'sigma^2' },
    { label: 'χ²', insert: 'chi_square' }, { label: 'P()', insert: 'P(' }, { label: 'E(X)', insert: 'E(' },
    { label: 'V(X)', insert: 'Var(' }, { label: 'N(μ,σ)', insert: 'Normal(' },
  ],
  Greek: [
    { label: 'α', insert: 'alpha' }, { label: 'β', insert: 'beta' }, { label: 'γ', insert: 'gamma' },
    { label: 'θ', insert: 'theta' }, { label: 'λ', insert: 'lambda' }, { label: 'ω', insert: 'omega' },
    { label: 'Δ', insert: 'Delta' }, { label: 'Σ', insert: 'Sigma' }, { label: 'Φ', insert: 'Phi' },
  ],
  Trig: [
    { label: 'sin', insert: 'sin(' }, { label: 'cos', insert: 'cos(' }, { label: 'tan', insert: 'tan(' },
    { label: 'sec', insert: 'sec(' }, { label: 'csc', insert: 'csc(' }, { label: 'cot', insert: 'cot(' },
    { label: 'asin', insert: 'asin(' }, { label: 'acos', insert: 'acos(' }, { label: 'atan', insert: 'atan(' },
  ]
};

export default function MathKeyboard({ onInsert }) {
  const [activeTab, setActiveTab] = useState('Basic');

  return (
    <div className="math-keyboard">
      <div className="keyboard-tabs">
        {TABS.map(tab => (
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
      <div className="keyboard-keys">
        {SYMBOLS[activeTab].map((sym, idx) => (
          <button
            key={idx}
            className="key-btn"
            onClick={() => onInsert(sym.insert)}
            type="button"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
}
