import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SubmissionReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report;

  useEffect(() => {
    if (!report) {
      navigate('/progress', { replace: true });
    }
  }, [report, navigate]);

  if (!report) {
    return null;
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '980px' }}>
        <div className="page-header">
          <h1>Submission Report</h1>
          <p>{report.questionTitle}</p>
        </div>

        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{Math.round(report.score)}%</div>
            <div className="stat-label">Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{report.steps.length}</div>
            <div className="stat-label">Steps Checked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{report.steps.filter((step) => step.valid).length}</div>
            <div className="stat-label">Valid Steps</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{report.verdict}</div>
            <div className="stat-label">Result</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Step-by-Step Review</h3>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {report.steps.map((step) => (
              <div key={step.step} className={`step-result ${step.valid ? 'valid' : 'invalid'}`}>
                <span className="result-icon">{step.valid ? '✅' : '❌'}</span>
                <div>
                  <span className="step-label">Line {step.step}:</span>{' '}
                  <span className="step-expr">{step.expression}</span>
                  {step.error && <div className="step-error">↳ {step.error}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`verdict-box ${report.verdict === 'Correct' ? 'correct' : 'incorrect'}`} style={{ marginBottom: '24px' }}>
          {report.verdict === 'Correct' ? 'Correct Answer!' : 'Incorrect Answer'}
          {report.correctAnswer && (
            <div className="correct-answer">Correct answer: {report.correctAnswer}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/progress', { replace: true })}>
            Exit to Progress
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/questions', { replace: true })}>
            Go to Questions
          </button>
        </div>
      </div>
    </div>
  );
}
