import type { ResumeData } from '../types';

interface TemplateProps {
  data: ResumeData;
}

export default function MinimalTemplate({ data }: TemplateProps) {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', padding: '48px 52px', background: '#fff', minHeight: '297mm', color: '#0f172a' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em', color: '#0f172a' }}>{data.personal.name || 'Your Name'}</div>
        {data.experience[0] && <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 400 }}>{data.experience[0].role}</div>}
        <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
          {data.personal.email && <span style={{ fontSize: 12, color: '#64748b' }}>{data.personal.email}</span>}
          {data.personal.phone && <span style={{ fontSize: 12, color: '#64748b' }}>{data.personal.phone}</span>}
          {data.personal.location && <span style={{ fontSize: 12, color: '#64748b' }}>{data.personal.location}</span>}
          {data.personal.Link2 && <span style={{ fontSize: 12, color: '#64748b' }}>{data.personal.Link2}</span>}
        </div>
      </div>
      {data.summary && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
        </div>
      )}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 14 }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{exp.role}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{exp.duration}</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{exp.company}</div>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 14 }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{edu.degree}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{edu.institution}</div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{edu.year}</div>
            </div>
          ))}
        </div>
      )}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 10 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 12, color: '#475569', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 10px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.projects.length > 0 && (
        <div>
          <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 14 }}>Projects</div>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{proj.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{proj.tech}</div>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
