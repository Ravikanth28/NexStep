import { useState, useRef, useEffect } from 'react';

export default function FlowControl() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const audioContext = useRef(null);
  const oscillator = useRef(null);
  const gainNode = useRef(null);

  const startNeuralAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create a low-frequency binaural-style hum
    oscillator.current = audioContext.current.createOscillator();
    gainNode.current = audioContext.current.createGain();
    
    oscillator.current.type = 'sine';
    oscillator.current.frequency.setValueAtTime(100, audioContext.current.currentTime);
    
    gainNode.current.gain.setValueAtTime(volume, audioContext.current.currentTime);
    
    oscillator.current.connect(gainNode.current);
    gainNode.current.connect(audioContext.current.destination);
    
    oscillator.current.start();
    setIsPlaying(true);
  };

  const stopNeuralAudio = () => {
    if (oscillator.current) {
      oscillator.current.stop();
      oscillator.current.disconnect();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (gainNode.current) {
        gainNode.current.gain.linearRampToValueAtTime(volume, audioContext.current.currentTime + 0.5);
    }
  }, [volume]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginRight: '20px'
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '1px' }}>FLOW STATE</div>
      <button 
        onClick={isPlaying ? stopNeuralAudio : startNeuralAudio}
        style={{
          background: 'none',
          border: 'none',
          color: isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      {isPlaying && (
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: '60px', accentColor: 'var(--accent-primary)' }}
        />
      )}
    </div>
  );
}
