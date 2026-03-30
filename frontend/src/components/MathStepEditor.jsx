/**
 * MathStepEditor – Visual multi-step math editor powered by MathLive.
 *
 * Each step is an independent <math-field> web component.  The parent
 * receives an array of LaTeX strings via onChange(steps: string[]).
 * Rows can be reordered by dragging the ⠿ handle on the left.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import 'mathlive';

// ─── drag handle icon ───────────────────────────────────────────────────────
function DragHandle({ onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to reorder"
      style={{
        cursor: 'grab',
        color: 'rgba(255,255,255,0.18)',
        fontSize: '1rem',
        padding: '0 4px',
        userSelect: 'none',
        flexShrink: 0,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      ⠿
    </div>
  );
}

// ─── single editable step row ──────────────────────────────────────────────
function StepRow({
  index, latex, onChange, onRemove, onAddAfter, onFocus, stepResult, readonly,
  isDragOver, dragOverPos, onDragStart, onDragEnter, onDragOver, onDrop, onDragEnd,
}) {
  const mfRef = useRef(null);

  // Sync external latex value into the math-field without triggering our own
  // onChange handler (to avoid infinite loops).
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (mf.getValue('latex') !== latex) {
      mf.setValue(latex, { suppressChangeNotifications: true });
    }
  }, [latex]);

  // Wire up MathLive events once the element is mounted.
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const handleInput = () => onChange(index, mf.getValue('latex'));
    const handleFocus = () => onFocus && onFocus(index);

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onAddAfter(index);
      }
      if (e.key === 'Backspace' && mf.getValue('latex') === '' && index > 0) {
        e.preventDefault();
        onRemove(index);
      }
    };

    mf.addEventListener('input', handleInput);
    mf.addEventListener('focus', handleFocus);
    mf.addEventListener('keydown', handleKeyDown);
    return () => {
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('focus', handleFocus);
      mf.removeEventListener('keydown', handleKeyDown);
    };
  }, [index, onChange, onAddAfter, onRemove, onFocus]);

  const resultColor =
    stepResult === undefined ? 'transparent' :
    stepResult?.valid ? '#00e5be' : '#ff4b6e';

  const resultLabel =
    stepResult === undefined ? '' :
    stepResult?.valid ? '✓' : '✗';

  // Drop-indicator line: show above or below depending on dragOverPos
  const indicatorStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '2px',
    background: '#00e5be',
    borderRadius: '2px',
    pointerEvents: 'none',
    zIndex: 10,
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        opacity: isDragOver === 'dragging' ? 0.35 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* drop-indicator above */}
      {isDragOver && dragOverPos === 'above' && (
        <div style={{ ...indicatorStyle, top: 0 }} />
      )}

      {/* drag handle */}
      {!readonly && <DragHandle />}

      {/* line number */}
      <div
        style={{
          minWidth: '24px',
          textAlign: 'right',
          fontFamily: 'JetBrains Mono',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}
      >
        {index + 1}
      </div>

      {/* math-field */}
      <math-field
        ref={mfRef}
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '1.15rem',
          color: 'white',
          minHeight: '48px',
          '--caret-color': '#00e5be',
          '--selection-background-color': 'rgba(0,229,190,0.25)',
          '--text-font-family': 'JetBrains Mono',
          outline: 'none',
        }}
        read-only={readonly ? '' : undefined}
      />

      {/* validation badge */}
      {stepResult !== undefined && (
        <div
          style={{
            minWidth: '24px',
            height: '24px',
            borderRadius: '50%',
            background: resultColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#0a0f1e',
            flexShrink: 0,
          }}
        >
          {resultLabel}
        </div>
      )}

      {/* remove button */}
      {!readonly && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0 4px',
            flexShrink: 0,
            lineHeight: 1,
          }}
          title="Remove step"
        >
          ×
        </button>
      )}

      {/* drop-indicator below */}
      {isDragOver && dragOverPos === 'below' && (
        <div style={{ ...indicatorStyle, bottom: 0 }} />
      )}
    </div>
  );
}

// ─── feedback tooltip under a step ─────────────────────────────────────────
function StepFeedback({ result }) {
  if (!result || result.valid) return null;
  return (
    <div
      style={{
        marginLeft: '56px',
        marginBottom: '4px',
        fontSize: '0.72rem',
        color: '#ff4b6e',
        fontFamily: 'JetBrains Mono',
      }}
    >
      {result.feedback || result.error || 'Incorrect'}
    </div>
  );
}

// ─── main editor ────────────────────────────────────────────────────────────
export default function MathStepEditor({ steps, onChange, results, onInsertFromKeyboard, activeStepIndex, onActiveStepChange }) {
  // dragState: { fromIndex, overIndex, overPos: 'above'|'below' } | null
  const [dragState, setDragState] = useState(null);
  const dragIndexRef = useRef(null);

  const handleStepChange = useCallback((index, latex) => {
    const next = [...steps];
    next[index] = latex;
    onChange(next);
  }, [steps, onChange]);

  const handleAddAfter = useCallback((index) => {
    const next = [...steps];
    next.splice(index + 1, 0, '');
    onChange(next);
    setTimeout(() => {
      const fields = document.querySelectorAll('math-field');
      if (fields[index + 1]) fields[index + 1].focus();
    }, 50);
  }, [steps, onChange]);

  const handleRemove = useCallback((index) => {
    if (steps.length <= 1) { onChange(['']); return; }
    const next = steps.filter((_, i) => i !== index);
    onChange(next);
    const focusIdx = Math.min(index, next.length - 1);
    setTimeout(() => {
      const fields = document.querySelectorAll('math-field');
      if (fields[focusIdx]) fields[focusIdx].focus();
    }, 50);
  }, [steps, onChange]);

  const handleAddStep = () => {
    onChange([...steps, '']);
    setTimeout(() => {
      const fields = document.querySelectorAll('math-field');
      if (fields[steps.length]) fields[steps.length].focus();
    }, 50);
  };

  // ── drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((index) => (e) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Needs a small delay so the drag image is captured before we dim the row
    setTimeout(() => setDragState((s) => ({ ...s, fromIndex: index })), 0);
  }, []);

  const handleDragEnter = useCallback((index) => (e) => {
    e.preventDefault();
    if (dragIndexRef.current === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
    setDragState((s) => ({ ...s, overIndex: index, overPos: pos }));
  }, []);

  const handleDragOver = useCallback((index) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
    setDragState((s) => {
      if (s?.overIndex === index && s?.overPos === pos) return s;
      return { ...s, overIndex: index, overPos: pos };
    });
  }, []);

  const handleDrop = useCallback((dropIndex) => (e) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const insertAfter = e.clientY >= rect.top + rect.height / 2;

    const next = [...steps];
    const [moved] = next.splice(fromIndex, 1);
    let targetIdx = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
    if (insertAfter) targetIdx += 1;
    next.splice(targetIdx, 0, moved);

    onChange(next);
    setDragState(null);
    dragIndexRef.current = null;
  }, [steps, onChange]);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    dragIndexRef.current = null;
  }, []);

  // Insert LaTeX from the keyboard into the currently active step
  useEffect(() => {
    if (onInsertFromKeyboard) {
      onInsertFromKeyboard.current = (latex) => {
        const idx = activeStepIndex ?? 0;
        const fields = document.querySelectorAll('math-field');
        if (fields[idx]) {
          fields[idx].focus();
          fields[idx].executeCommand(['insert', latex]);
        }
      };
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((latex, i) => (
        <div key={i}>
          <StepRow
            index={i}
            latex={latex}
            onChange={handleStepChange}
            onRemove={handleRemove}
            onAddAfter={handleAddAfter}
            onFocus={onActiveStepChange}
            stepResult={results ? results[i] : undefined}
            isDragOver={
              dragState?.fromIndex === i ? 'dragging' :
              dragState?.overIndex === i ? 'over' : null
            }
            dragOverPos={dragState?.overIndex === i ? dragState.overPos : null}
            onDragStart={handleDragStart(i)}
            onDragEnter={handleDragEnter(i)}
            onDragOver={handleDragOver(i)}
            onDrop={handleDrop(i)}
            onDragEnd={handleDragEnd}
          />
          <StepFeedback result={results ? results[i] : null} />
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddStep}
        style={{
          marginTop: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '10px',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontFamily: 'JetBrains Mono',
          textAlign: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
      >
        + Add step  (or press Enter inside any step)
      </button>
    </div>
  );
}
