import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteSubmission, getStudentDashboard } from '../api';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    const confirmed = window.confirm('Permanently purge this transmission log?');
    if (!confirmed) return;

    setDeletingId(submissionId);
    try {
      await deleteSubmission(submissionId);
      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to purge log');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <section className="workspace-hero" style={{ padding: '60px', gridTemplateColumns: '1fr 450px', alignItems: 'center' }}>
          <div>
            <div className="hero-kicker">Neural Progress Observatory</div>
            <h1 className="hero-title"><span className="text-gradient">Telemetry &</span><br />Growth Analysis.</h1>
            <p className="hero-subtitle">Continuous monitoring of symbolic mastery, error entropy, and derivation efficiency across all curriculum nodes.</p>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <div className="badge badge-easy">LATENCY: 12ms</div>
              <div className="badge badge-medium">STATUS: NOMINAL</div>
              <div className="badge badge-hard">SECURITY: RSA-4096</div>
            </div>
          </div>
          
          <div className="card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
            <div className="hero-kicker" style={{ fontSize: '0.65rem', marginBottom: '24px' }}>Peak Optimization Zone</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>MASTERED</div>
                <div style={{ fontWeight: 800, marginTop: '4px', fontSize: '1.1rem' }}>Laplace Domain</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>AVG SCORE</div>
                <div style={{ fontWeight: 800, marginTop: '4px', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>{dashboard.overview.avg_score}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>SYSTEM QUASH RANK</div>
                <div className="badge badge-solved" style={{ marginTop: '12px', width: '100%', textAlign: 'center' }}>ELITE DATA SCIENTIST</div>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card">
            <div className="stat-value text-gradient">{dashboard.overview.total_submissions}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.overview.correct_submissions}</div>
            <div className="stat-label">Verified Proved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-gradient">{dashboard.overview.accuracy}%</div>
            <div className="stat-label">Global Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">INSTANT</div>
            <div className="stat-label">Engine Latency</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>
          <main>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Digital Performance Ledger</h3>
                <div className="badge badge-easy" style={{ fontSize: '0.6rem' }}>SYNCHRONIZED</div>
              </div>
              <div style={{ padding: '32px 40px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Question Node</th>
                      <th>Throughput</th>
                      <th>Peak Score</th>
                      <th>Status State</th>
                      <th style={{ textAlign: 'right' }}>Instruction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.question_stats.map((q) => (
                      <tr key={q.question_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ fontWeight: 700, padding: '24px 8px' }}>{q.question_title}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{q.attempts}</td>
                        <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{Math.round(q.best_score)}%</td>
                        <td>
                          <div className={`badge ${q.solved ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem' }}>
                            {q.solved ? 'STABLE' : 'UNSTABLE'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '8px 20px', fontSize: '0.75rem' }}
                            onClick={() => navigate(`/solve/${q.question_id}`)}
                          >
                            {q.solved ? 'RETRY' : 'SOLVE'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          <aside>
            <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'rgba(5, 8, 17, 0.4)' }}>
              <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Recent Transmission Logs</h3>
              </div>
              <div style={{ padding: '32px 40px' }} className="scroll-column">
                {dashboard.recent_submissions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📡</div>
                    <p style={{ fontSize: '0.85rem' }}>Awaiting data transmission...</p>
                  </div>
                ) : (
                  dashboard.recent_submissions.map((s) => (
                    <div key={s.id} className="stat-card" style={{ padding: '24px', margin: '0 0 20px 0', background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, flex: 1, marginRight: '12px' }}>{s.question_title}</div>
                        <div className={`badge ${s.is_correct ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem', height: 'fit-content' }}>
                          {s.is_correct ? 'OK' : 'ERR'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.is_correct ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{Math.round(s.score)}%</div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 800 }}
                          onClick={() => navigate(`/submission-report/${s.id}`)}
                        >
                          VIEW LOG
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 800, borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                          onClick={() => handleDeleteSubmission(s.id)}
                          disabled={deletingId === s.id}
                        >
                          {deletingId === s.id ? 'PURGING...' : 'PURGE'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
