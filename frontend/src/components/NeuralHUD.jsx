const FORMULA_LIBRARY = {
  "integral": [
    { name: "Power Rule", formula: "∫x^n dx = x^(n+1)/(n+1) + C" },
    { name: "Exponential", formula: "∫e^x dx = e^x + C" },
    { name: "Trig (Sin)", formula: "∫sin(x) dx = -cos(x) + C" },
    { name: "Trig (Cos)", formula: "∫cos(x) dx = sin(x) + C" },
    { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du" }
  ],
  "ode": [
    { name: "1st Order Linear", formula: "y' + P(x)y = Q(x)" },
    { name: "Integrating Factor", formula: "I(x) = e^∫P(x)dx" },
    { name: "Bernoulli", formula: "y' + P(x)y = Q(x)y^n" }
  ],
  "transform": [
    { name: "Laplace (t^n)", formula: "L{t^n} = n!/s^(n+1)" },
    { name: "Laplace (e^at)", formula: "L{e^at} = 1/(s-a)" },
    { name: "Inverse Laplace", formula: "L^-1{F(s)} = f(t)" }
  ],
  "matrix": [
    { name: "Inverse (2x2)", formula: "A^-1 = 1/|A| * [d -b; -c a]" },
    { name: "Determinant", formula: "det(A) = Σ ± a_ij M_ij" }
  ],
  "general": [
    { name: "Quadratic", formula: "x = (-b ± √(b^2 - 4ac)) / 2a" },
    { name: "Pythagorean", formula: "sin²x + cos²x = 1" }
  ]
};

export default function NeuralHUD({ topic }) {
  const normalizedTopic = (topic || 'general').toLowerCase();
  const formulas = FORMULA_LIBRARY[normalizedTopic] || FORMULA_LIBRARY['general'];

  return (
    <div className="neural-hud" style={{ padding: '0 20px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '16px', letterSpacing: '1px' }}>
          COGNITIVE OVERLAY: {normalizedTopic.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {formulas.map((f, i) => (
          <div key={i} style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.2s ease'
          }} className="hud-item">
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 800 }}>{f.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{f.formula}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px', fontSize: '0.55rem', opacity: 0.3, fontStyle: 'italic' }}>
          * Contextual HUD synchronized with problem node.
      </div>
    </div>
  );
}
