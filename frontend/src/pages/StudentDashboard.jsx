import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteSubmission, getStudentDashboard } from '../api';

function MasteryHeatmap({ mastery }) {
  const categories = Object.keys(mastery || {});
  
  if (categories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Insufficient data for neural mapping.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
      {categories.map(cat => (
        <div key={cat} style={{ background: 'rgba(46,60,181,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(46,60,181,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{cat.toUpperCase()}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: mastery[cat] > 80 ? 'var(--accent-success)' : mastery[cat] > 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
              {mastery[cat]}%
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(210,230,248,0.80)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${mastery[cat]}%`, 
                height: '100%', 
                background: mastery[cat] > 80 ? 'var(--accent-success)' : mastery[cat] > 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'
              }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
            <h1 className="hero-title">Level {dashboard.overview.level} <span className="text-gradient">Engineer</span></h1>
            <p className="hero-subtitle">Symbolic mastery detected across {Object.keys(dashboard.mastery).length} distinct mathematical domains.</p>
            
            <div style={{ marginTop: '24px', width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                <span>XP: {dashboard.overview.xp % 1000} / 1000</span>
                <span>TOTAL: {dashboard.overview.xp}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(210,230,248,0.60)', borderRadius: '4px', border: '1px solid var(--border-main)' }}>
                <div style={{ width: `${(dashboard.overview.xp % 1000) / 10}%`, height: '100%', background: '#2e3cb5', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: '32px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(46,60,181,0.15)', position: 'relative' }}>
             <h3 style={{ fontSize: '0.85rem', marginBottom: '20px', color: '#2e3cb5', fontWeight: 800 }}>CONCEPTUAL HEATMAP</h3>
             <MasteryHeatmap mastery={dashboard.mastery} />
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
            <div className="stat-value">{dashboard.overview.avg_score}%</div>
            <div className="stat-label">Avg Stability</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>
          <main>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(240,248,255,0.60)' }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Digital Performance Ledger</h3>
                <div className="badge badge-easy" style={{ fontSize: '0.55rem' }}>SYNCHRONIZED</div>
              </div>
              <div style={{ padding: '0' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '32px' }}>Question Node</th>
                      <th>Attempts</th>
                      <th>Peak Score</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '32px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.question_stats.map((q) => (
                      <tr key={q.question_id} className="table-row-hover">
                        <td style={{ padding: '20px 32px', fontWeight: 700 }}>{q.question_title}</td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{q.attempts}</td>
                        <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{Math.round(q.best_score)}%</td>
                        <td>
                          <div className={`badge ${q.solved ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem' }}>
                            {q.solved ? 'STABLE' : 'UNSTABLE'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.7rem' }} onClick={() => navigate(`/solve/${q.question_id}`)}>
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
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-main)', background: 'rgba(240,248,255,0.60)' }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Recent Transmissions</h3>
              </div>
              <div style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
                {dashboard.recent_submissions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
                    <div style={{ fontSize: '2rem' }}>📡</div>
                    <p>Awaiting logs...</p>
                  </div>
                ) : (
                  dashboard.recent_submissions.map((s) => (
                    <div key={s.id} className="stat-card" style={{ padding: '20px', margin: '0 0 16px 0', background: 'rgba(246,250,255,0.90)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{s.question_title}</div>
                        <div style={{ fontWeight: 800, color: s.is_correct ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{Math.round(s.score)}%</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                         <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.6rem' }} onClick={() => navigate(`/submission-report/${s.id}`)}>VIEW REPORT</button>
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
