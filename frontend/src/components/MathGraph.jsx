import React, { useEffect, useRef } from 'react';
import functionPlot from 'function-plot';

export default function MathGraph({ expression, problemExpr }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;

    // Helper to sanitize SymPy expression for function-plot
    const sanitize = (expr) => {
      if (!expr) return null;
      // Defensive check for engineering notation that crashes function-plot
      if (typeof expr !== 'string' || expr.includes('L[') || expr.includes('[[') || expr.includes('\\')) return null;
      
      return expr
        .replace(/\*\*/g, '^')
        .replace(/·/g, '*')
        .replace(/exp\((.*?)\)/g, 'e^($1)')
        .replace(/log\((.*?)\)/g, 'ln($1)');
    };

    const fn = sanitize(expression);
    const targetFn = sanitize(problemExpr);

    try {
      if (!rootRef.current) return;
      rootRef.current.innerHTML = '';
      
      // If neither is plottable, don't attempt to initialize
      if (!fn && !targetFn) {
          rootRef.current.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.7rem;">Symbolic notation active: 2D mapping suppressed.</div>';
          return;
      }

      functionPlot({
        target: rootRef.current,
        width: 350,
        height: 250,
        yAxis: { domain: [-10, 10] },
        xAxis: { domain: [-10, 10] },
        grid: true,
        data: [
          fn ? {
            fn: fn,
            color: 'var(--accent-primary)',
            graphType: 'polyline'
          } : null,
          targetFn ? {
            fn: targetFn,
            color: 'rgba(255, 255, 255, 0.1)',
            graphType: 'polyline',
            skipTip: true
          } : null
        ].filter(Boolean)
      });
    } catch (e) {
      console.warn("Plot Engine Suppressed Error:", e);
      if (rootRef.current) rootRef.current.innerHTML = '';
    }
  }, [expression, problemExpr]);

  return (
    <div className="math-graph-container" style={{ 
      background: 'rgba(0,0,0,0.2)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      border: '1px solid var(--border-main)',
      marginTop: '20px',
      minHeight: '250px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div ref={rootRef} />
    </div>
  );
}
