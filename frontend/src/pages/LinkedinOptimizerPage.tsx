import { useState } from 'react';
import { extractPdfText } from '../lib/careerbot-api';
import { api } from '../api/client';

export default function LinkedinOptimizerPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | null) => {
    if (!file) return;
    setError('');
    try {
      const text = await extractPdfText(file);
      setResumeText(text);
    } catch (e: any) {
      setError(e?.message || 'Could not read PDF file');
    }
  };

  const generate = async () => {
    setError('');
    if (resumeText.trim().length < 100) {
      setError('Resume text must be at least 100 characters.');
      return;
    }
    if (targetRole.trim().length < 2) {
      setError('Target role must be at least 2 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.optimizeLinkedin(resumeText, targetRole);
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to optimize profile');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="page-container">
      <h1>LinkedIn Optimizer</h1>
      <div className="card">
        {error && <p style={{ color: '#ef4444', marginTop: 0 }}>{error}</p>}
        <textarea rows={9} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste resume text..." />
        <input type="file" accept=".pdf" onChange={(e) => upload(e.target.files?.[0] || null)} />
        <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role" />
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Optimizing...' : 'Optimize Profile'}
        </button>
      </div>
      {result && (
        <div className="card">
          <h3>Headline ({result.headline.length}/120)</h3>
          <p>{result.headline}</p>
          <button className="btn btn-secondary" onClick={() => copy(result.headline)}>Copy Headline</button>
          <h3>About</h3>
          <p>{result.aboutSection}</p>
          <button className="btn btn-secondary" onClick={() => copy(result.aboutSection)}>Copy About</button>
          <h3>Top Skills</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.topSkills.map((s: string) => <span className="badge badge-reviewing" key={s}>{s}</span>)}
          </div>
          <h3>Tips</h3>
          <ol>{result.tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}</ol>
        </div>
      )}
    </div>
  );
}
