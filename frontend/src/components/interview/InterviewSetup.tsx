import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, FileText, X, Play, CircleAlert, Mic, Briefcase, Zap } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { InterviewSetupProps, InterviewSetupData, DifficultyLevel } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DIFFICULTY_CONFIG = {
  entry: { label: 'Entry Level', years: '0-2 years', icon: '🌱', color: '#10b981' },
  mid:   { label: 'Mid Level',   years: '3-5 years', icon: '🚀', color: '#6366f1' },
  senior:{ label: 'Senior Level',years: '5+ years',  icon: '⭐', color: '#f59e0b' },
};

export default function InterviewSetup({ onStart, isLoading = false }: InterviewSetupProps) {
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('mid');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText.trim();
  };

  const handleFileUpload = async (file: File) => {
    setError('');
    setIsExtracting(true);
    try {
      if (file.type !== 'application/pdf') throw new Error('Please upload a PDF file');
      if (file.size > 10 * 1024 * 1024) throw new Error('File size must be less than 10MB');
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 50) throw new Error('Could not extract enough text. Try pasting your resume instead.');
      setResumeText(text);
      setResumeFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleClear = () => {
    setResumeText(''); setResumeFileName(''); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStart = () => {
    if (!resumeText.trim()) { setError('Please upload a resume or paste your resume text'); return; }
    const data: InterviewSetupData = {
      resumeText: resumeText.trim(),
      resumeFileName: resumeFileName || undefined,
      jobDescription: jobDescription.trim() || undefined,
      difficultyLevel: difficulty,
    };
    onStart(data);
  };

  const wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="page-container" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)',
          borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700,
          marginBottom: 14, border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <Mic size={13} /> AI Mock Interview
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Prepare for your next interview
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Upload your resume and get a realistic AI-powered interview tailored to your experience
        </p>
      </div>

      {/* Step 1 — Resume */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>1</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Upload Your Resume</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF file or paste text below</div>
            </div>
          </div>
          {resumeFileName && (
            <button onClick={handleClear} style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px',
              borderRadius: 6, transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-rose)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Drop zone */}
        {!resumeFileName ? (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
              cursor: isExtracting ? 'wait' : 'pointer',
              background: isDragging ? 'rgba(99,102,241,0.04)' : 'var(--bg-glass)',
              transition: 'all 0.2s', marginBottom: 16,
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} disabled={isExtracting} />
            {isExtracting ? (
              <>
                <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Extracting text from PDF...</div>
              </>
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <Upload size={22} color="var(--accent-primary)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Drop your resume here or click to browse
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF files up to 10MB</div>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: 'rgba(16,185,129,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={18} color="#10b981" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{resumeFileName}</div>
              <div style={{ fontSize: 11, color: '#10b981' }}>{wordCount} words extracted</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 999 }}>
              Ready
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Or paste resume text
        </div>
        <textarea
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste your resume text here..."
          rows={5}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 8, resize: 'vertical',
            border: '1.5px solid var(--border-primary)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-primary)')}
        />
        {resumeText && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{wordCount} words</div>
        )}
      </div>

      {/* Step 2 — Job Description */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0,
          }}>2</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Job Description <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tailors questions to the specific role</div>
          </div>
        </div>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to get role-specific questions..."
          rows={4}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 8, resize: 'vertical',
            border: '1.5px solid var(--border-primary)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-primary)')}
        />
      </div>

      {/* Step 3 — Difficulty */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0,
          }}>3</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Experience Level</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sets the difficulty of questions</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(Object.entries(DIFFICULTY_CONFIG) as [DifficultyLevel, typeof DIFFICULTY_CONFIG.entry][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              style={{
                padding: '14px 12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                border: `2px solid ${difficulty === key ? cfg.color : 'var(--border-primary)'}`,
                background: difficulty === key ? `${cfg.color}10` : 'var(--bg-card)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{cfg.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: difficulty === key ? cfg.color : 'var(--text-primary)', marginBottom: 2 }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.years}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#dc2626',
        }}>
          <CircleAlert size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Start button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleStart}
          disabled={!resumeText.trim() || isExtracting || isLoading}
          className="btn btn-primary"
          style={{ padding: '14px 40px', fontSize: 15, fontWeight: 700, gap: 10, minWidth: 220 }}
        >
          {isLoading ? (
            <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Starting interview...</>
          ) : (
            <><Play size={16} /> Start Interview</>
          )}
        </button>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={11} /> 8-12 questions</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={11} /> Real-world scenarios</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mic size={11} /> Voice input supported</span>
        </div>
      </div>
    </div>
  );
}
