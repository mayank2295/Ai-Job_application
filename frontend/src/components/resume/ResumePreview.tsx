import { lazy, Suspense, memo } from 'react';
import { Download, Eye } from 'lucide-react';
import type { ResumeData, Template } from './types';

const ModernTemplate  = lazy(() => import('./templates/ModernTemplate'));
const ClassicTemplate = lazy(() => import('./templates/ClassicTemplate'));
const MinimalTemplate = lazy(() => import('./templates/MinimalTemplate'));
const CreativeTemplate = lazy(() => import('./templates/CreativeTemplate'));

interface ResumePreviewProps { data: ResumeData; template: Template; onDownload: () => void; }

const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
    <div className="loading-spinner" />
  </div>
);

export default memo(function ResumePreview({ data, template, onDownload }: ResumePreviewProps) {
  const renderTemplate = () => {
    switch (template) {
      case 'modern':   return <ModernTemplate data={data} />;
      case 'classic':  return <ClassicTemplate data={data} />;
      case 'minimal':  return <MinimalTemplate data={data} />;
      case 'creative': return <CreativeTemplate data={data} />;
      default:         return <ModernTemplate data={data} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-card)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Live Preview</span>
        </div>
        <button
          onClick={onDownload}
          className="btn btn-primary"
          style={{ padding: '7px 14px', fontSize: 12, gap: 6 }}
        >
          <Download size={13} /> Download PDF
        </button>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-tertiary)', padding: 20 }}>
        <div
          id="resume-preview"
          style={{ maxWidth: 794, margin: '0 auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', minHeight: 1123 }}
        >
          <Suspense fallback={<Fallback />}>
            {renderTemplate()}
          </Suspense>
        </div>
      </div>
    </div>
  );
});
