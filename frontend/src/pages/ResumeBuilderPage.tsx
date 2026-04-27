import { useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import ResumeWizard from '../components/resume/ResumeWizard';
import ResumePreview from '../components/resume/ResumePreview';
import type { ResumeData, Template } from '../components/resume/types';

function injectPrintStyles() {
  const id = 'resume-print-style';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@media print{body *{visibility:hidden!important}#resume-preview,#resume-preview *{visibility:visible!important}#resume-preview{position:fixed!important;left:0!important;top:0!important;width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;box-shadow:none!important;z-index:99999!important;background:white!important}@page{size:A4;margin:0}}`;
    document.head.appendChild(style);
  }
  setTimeout(() => window.print(), 100);
}

export default function ResumeBuilderPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('modern');

  const handleComplete = (data: ResumeData, template: Template) => {
    setResumeData(data);
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  if (showPreview && resumeData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-card)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="var(--accent-primary)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Resume Builder</span>
          </div>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-glass)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} /> Back to Editor
          </button>
        </div>

        {/* Split view */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '50%', borderRight: '1px solid var(--border-primary)', overflowY: 'auto', padding: 20 }}>
            <ResumeWizard onComplete={handleComplete} />
          </div>
          <div style={{ width: '50%', overflow: 'hidden' }}>
            <ResumePreview data={resumeData} template={selectedTemplate} onDownload={injectPrintStyles} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Resume Builder
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Create a professional resume in minutes with our step-by-step wizard
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14 }}>
          {[
            { icon: '🎨', label: '4 templates' },
            { icon: '💾', label: 'Auto-saved' },
            { icon: '📄', label: 'PDF export' },
            { icon: '👁️', label: 'Live preview' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{f.icon}</span> {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard */}
      <div className="card" style={{ padding: 28 }}>
        <ResumeWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
