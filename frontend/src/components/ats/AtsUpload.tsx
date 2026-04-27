import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, FileText, X, Zap, CircleCheck, CircleAlert, Target } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { AtsUploadProps, AtsUploadData } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

async function extractPDF(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((x: any) => x.str).join(' ') + '\n';
  }
  return text.trim();
}

interface UploadZoneProps {
  label: string;
  sublabel: string;
  file: File | null;
  text: string;
  isDragging: boolean;
  isExtracting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClear: () => void;
  onTextChange: (v: string) => void;
  textPlaceholder: string;
  accentColor: string;
  icon: React.ReactNode;
}

function UploadZone({
  label, sublabel, file, text, isDragging, isExtracting,
  inputRef, onFileChange, onDragOver, onDragLeave, onDrop,
  onClear, onTextChange, textPlaceholder, accentColor, icon,
}: UploadZoneProps) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: `${accentColor}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sublabel}</div>
          </div>
        </div>
        {file && (
          <button onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 8px',
            borderRadius: 6, transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-rose)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Drop zone or file badge */}
      {!file ? (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !isExtracting && inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? accentColor : 'var(--border-primary)'}`,
            borderRadius: 10, padding: '20px 16px', textAlign: 'center',
            cursor: isExtracting ? 'wait' : 'pointer',
            background: isDragging ? `${accentColor}06` : 'var(--bg-glass)',
            transition: 'all 0.2s',
          }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt" onChange={onFileChange} style={{ display: 'none' }} disabled={isExtracting} />
          {isExtracting ? (
            <><div className="loading-spinner" style={{ margin: '0 auto 8px' }} /><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Extracting...</div></>
          ) : (
            <>
              <Upload size={20} color={accentColor} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Drop file or click to browse</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF or TXT, max 10MB</div>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8,
        }}>
          <FileText size={16} color="#10b981" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: '#10b981' }}>{wordCount} words</div>
          </div>
          <CircleCheck size={15} color="#10b981" />
        </div>
      )}

      {/* Text area */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Or paste text
        </div>
        <textarea
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder={textPlaceholder}
          rows={6}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
            border: '1.5px solid var(--border-primary)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 12, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = accentColor)}
          onBlur={e => (e.target.style.borderColor = 'var(--border-primary)')}
        />
        {text && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{wordCount} words</div>}
      </div>
    </div>
  );
}

export default function AtsUpload({ onAnalyze, isAnalyzing = false }: AtsUploadProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isJdDragging, setIsJdDragging] = useState(false);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const jdRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');

  const processFile = async (
    file: File,
    setFile: (f: File) => void,
    setText: (t: string) => void,
    setExtracting: (v: boolean) => void,
    minLen = 50
  ) => {
    setError('');
    setExtracting(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      let text = '';
      if (file.type === 'application/pdf') text = await extractPDF(file);
      else if (file.type === 'text/plain') text = await file.text();
      else throw new Error('Only PDF and TXT files are supported');
      if (text.length < minLen) throw new Error('Could not extract enough text. Try pasting instead.');
      setFile(file);
      setText(text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleAnalyze = () => {
    if (!resumeText.trim()) { setError('Please provide your resume'); return; }
    if (!jdText.trim()) { setError('Please provide the job description'); return; }
    const data: AtsUploadData = {
      resumeFile: resumeFile || undefined,
      resumeText: resumeText.trim(),
      jobDescriptionFile: jdFile || undefined,
      jobDescriptionText: jdText.trim(),
    };
    onAnalyze(data);
  };

  const canAnalyze = resumeText.trim() && jdText.trim() && !isExtractingResume && !isExtractingJd;

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)',
          borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700,
          marginBottom: 14, border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <Target size={13} /> ATS Resume Analyzer
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          How well does your resume match?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Upload your resume and the job description to get an instant ATS compatibility score
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '🎯', label: 'Keyword Match', sub: 'vs job description' },
          { icon: '📊', label: 'Score Breakdown', sub: '5 categories' },
          { icon: '💡', label: 'Actionable Tips', sub: 'to improve your CV' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px 16px', borderRadius: 10, textAlign: 'center',
            background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column upload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <UploadZone
          label="Your Resume"
          sublabel="The document you want to analyze"
          file={resumeFile}
          text={resumeText}
          isDragging={isResumeDragging}
          isExtracting={isExtractingResume}
          inputRef={resumeRef}
          onFileChange={e => { const f = e.target.files?.[0]; if (f) processFile(f, setResumeFile, setResumeText, setIsExtractingResume); }}
          onDragOver={e => { e.preventDefault(); setIsResumeDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsResumeDragging(false); }}
          onDrop={e => { e.preventDefault(); setIsResumeDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f, setResumeFile, setResumeText, setIsExtractingResume); }}
          onClear={() => { setResumeFile(null); setResumeText(''); if (resumeRef.current) resumeRef.current.value = ''; }}
          onTextChange={setResumeText}
          textPlaceholder="Paste your resume text here..."
          accentColor="#6366f1"
          icon={<FileText size={16} color="#6366f1" />}
        />
        <UploadZone
          label="Job Description"
          sublabel="The role you're applying for"
          file={jdFile}
          text={jdText}
          isDragging={isJdDragging}
          isExtracting={isExtractingJd}
          inputRef={jdRef}
          onFileChange={e => { const f = e.target.files?.[0]; if (f) processFile(f, setJdFile, setJdText, setIsExtractingJd, 20); }}
          onDragOver={e => { e.preventDefault(); setIsJdDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsJdDragging(false); }}
          onDrop={e => { e.preventDefault(); setIsJdDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f, setJdFile, setJdText, setIsExtractingJd, 20); }}
          onClear={() => { setJdFile(null); setJdText(''); if (jdRef.current) jdRef.current.value = ''; }}
          onTextChange={setJdText}
          textPlaceholder="Paste the job description here..."
          accentColor="#8b5cf6"
          icon={<Zap size={16} color="#8b5cf6" />}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#dc2626',
        }}>
          <CircleAlert size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Analyze button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className="btn btn-primary"
          style={{ padding: '14px 44px', fontSize: 15, fontWeight: 700, gap: 10, minWidth: 220 }}
        >
          {isAnalyzing ? (
            <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
          ) : (
            <><Target size={16} /> Analyze Resume</>
          )}
        </button>
      </div>
    </div>
  );
}
