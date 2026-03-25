import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../api';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Progress</h1>
          <p>Track your integral calculus journey</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{dashboard.overview.total_submissions}</div>
            <div className="stat-label">Submissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.overview.correct_submissions}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.overview.accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.overview.avg_score}</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>

        {/* Question Progress */}
        {dashboard.question_stats.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">📚 Question Progress</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Attempts</th>
                    <th>Best Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.question_stats.map((q) => (
                    <tr key={q.question_id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{q.question_title}</td>
                      <td>{q.attempts}</td>
                      <td>{Math.round(q.best_score)}%</td>
                      <td>
                        <span className={`badge ${q.solved ? 'badge-easy' : 'badge-hard'}`}>
                          {q.solved ? '✅ Solved' : '❌ Unsolved'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/solve/${q.question_id}`)}>
                          {q.solved ? 'Retry' : 'Solve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🕐 Recent Submissions</h3>
          </div>
          {dashboard.recent_submissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No submissions yet</h3>
              <p>Start solving problems to see your progress!</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/questions')}>
                Browse Questions
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Result</th>
                    <th>Score</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent_submissions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.question_title}</td>
                      <td>
                        <span className={`badge ${s.is_correct ? 'badge-easy' : 'badge-hard'}`}>
                          {s.is_correct ? '✅ Correct' : '❌ Incorrect'}
                        </span>
                      </td>
                      <td>{Math.round(s.score)}%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
