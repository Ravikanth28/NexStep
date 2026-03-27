import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSubmission, getSubmission } from '../api';

export default function SubmissionReportPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [submissionId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getSubmission(submissionId);
      setReport(data);
    } catch (err) {
      console.error(err);
      navigate('/progress', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    const confirmed = window.confirm('Permanently delete this mathematical record?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteSubmission(report.id);
      navigate('/progress', { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const exportResult = () => {
    const payload = JSON.stringify(report, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (!report) return null;

  const validSteps = report.steps.filter(s => s.valid).length;

  return (
    <div className="page" style={{ padding: '0 0 60px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={() => navigate('/progress')}>
            &larr; Back to Telemetry
          </button>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-outline" onClick={exportResult}>Export JSON</button>
            <button className="btn btn-outline" style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Purging...' : 'Purge Record'}
            </button>
          </div>
        </div>

        <section className="workspace-hero" style={{ padding: '60px', gridTemplateColumns: '1fr 450px', alignItems: 'center' }}>
          <div>
            <div className="hero-kicker">Submission Report #{report.id}</div>
            <h1 className="hero-title">{report.question_title}</h1>
            <div className="chip-wrap" style={{ margin: '20px 0' }}>
              <div className="badge badge-easy">{report.subject || 'Engineering Math'}</div>
              <div className="badge badge-medium">{report.topic}</div>
              <div className="badge badge-hard">{report.validation_strategy}</div>
            </div>
            <div className="problem" style={{ fontSize: '1.2rem', padding: '24px', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--accent-primary)' }}>
              {report.problem_expr}
            </div>
          </div>

          <div className="card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>AGGREGATE SCORE</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{Math.round(report.score)}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>STEP ACCURACY</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{validSteps}/{report.steps.length}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, marginBottom: '8px' }}>VERDICT</div>
                <div className={`badge ${report.verdict === 'Correct' ? 'badge-solved' : 'badge-unsolved'}`} style={{ width: '100%', textAlign: 'center', padding: '12px' }}>
                  {report.verdict === 'Correct' ? 'SYMBOLICALLY PROVED' : 'DERIVATION FAILED'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="builder-grid" style={{ gridTemplateColumns: '1fr 400px', gap: '40px' }}>
          <main>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Step-by-Step Validation History</h3>
              </div>
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {report.steps.map((step, idx) => (
                  <div key={idx} className="stat-card" style={{ padding: '24px', margin: 0, borderColor: step.valid ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>LINE {step.step}</div>
                      <div className={`badge ${step.valid ? 'badge-solved' : 'badge-unsolved'}`} style={{ fontSize: '0.6rem' }}>{step.valid ? 'VALID' : 'INVALID'}</div>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', color: step.valid ? 'white' : 'var(--accent-danger)' }}>{step.expression}</div>
                    {step.error && <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--accent-danger)', background: 'rgba(255,0,0,0.05)', padding: '8px 12px', borderRadius: '4px' }}>↳ {step.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside>
            <div className="card" style={{ padding: '32px' }}>
              <div className="hero-kicker" style={{ fontSize: '0.65rem' }}>Next Phase Guidance</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>AI Recommended Path</h3>
              <div className="analysis-note-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Re-initialize the solving engine to correct lines marked with <span style={{ color: 'var(--accent-danger)' }}>INVALID</span> status.
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Ensure all symbolic constants are declared using standard Sympy notation for better parsing confidence.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/solve/${report.question_id}`)}>
                  Re-Attempt Solution
                </button>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/questions')}>
                  Explore New Domains
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
