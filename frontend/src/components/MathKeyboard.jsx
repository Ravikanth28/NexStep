import { useState } from 'react';

const TABS = ['Basic', 'αβγ', 'ABΓ', 'Trig', 'Calculus'];

const SYMBOLS = {
  Basic: [
    { label: 'x²', insert: 'x^2' },
    { label: 'xⁿ', insert: '^' },
    { label: '√x', insert: 'sqrt(' },
    { label: 'π', insert: 'pi' },
    { label: 'e', insert: 'e' },
    { label: '∞', insert: 'oo' },
    { label: '+', insert: ' + ' },
    { label: '-', insert: ' - ' },
    { label: '×', insert: ' * ' },
    { label: '÷', insert: ' / ' },
    { label: '=', insert: ' = ' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '|x|', insert: 'abs(' },
    { label: 'log', insert: 'log(' },
    { label: 'ln', insert: 'ln(' },
  ],
  'αβγ': [
    { label: 'α', insert: 'alpha' }, { label: 'β', insert: 'beta' }, { label: 'γ', insert: 'gamma' },
    { label: 'δ', insert: 'delta' }, { label: 'ε', insert: 'epsilon' }, { label: 'θ', insert: 'theta' },
    { label: 'λ', insert: 'lambda' }, { label: 'μ', insert: 'mu' }, { label: 'π', insert: 'pi' },
    { label: 'ρ', insert: 'rho' }, { label: 'σ', insert: 'sigma' }, { label: 'φ', insert: 'phi' },
    { label: 'ω', insert: 'omega' },
  ],
  'ABΓ': [
    { label: 'Δ', insert: 'Delta' }, { label: 'Γ', insert: 'Gamma' }, { label: 'Θ', insert: 'Theta' },
    { label: 'Λ', insert: 'Lambda' }, { label: 'Ξ', insert: 'Xi' }, { label: 'Π', insert: 'Pi' },
    { label: 'Σ', insert: 'Sigma' }, { label: 'Φ', insert: 'Phi' }, { label: 'Ψ', insert: 'Psi' },
    { label: 'Ω', insert: 'Omega' },
  ],
  Trig: [
    { label: 'sin', insert: 'sin(' }, { label: 'cos', insert: 'cos(' }, { label: 'tan', insert: 'tan(' },
    { label: 'sec', insert: 'sec(' }, { label: 'csc', insert: 'csc(' }, { label: 'cot', insert: 'cot(' },
    { label: 'asin', insert: 'asin(' }, { label: 'acos', insert: 'acos(' }, { label: 'atan', insert: 'atan(' },
  ],
  Calculus: [
    { label: '∫', insert: '∫' },
    { label: 'd/dx', insert: 'd/dx ' },
    { label: 'lim', insert: 'lim(' },
    { label: '∑', insert: 'sum(' },
    { label: '∏', insert: 'prod(' },
    { label: '+ C', insert: ' + C' },
    { label: 'dx', insert: ' dx' },
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
