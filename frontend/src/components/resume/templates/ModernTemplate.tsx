import type { ResumeData } from '../types';

interface TemplateProps {
  data: ResumeData;
}

export default function ModernTemplate({ data }: TemplateProps) {
  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', display: 'flex', minHeight: '297mm', background: '#fff' }}>
      {/* Left sidebar */}
      <div style={{ width: '34%', background: '#6366f1', color: '#fff', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            {data.personal.name.charAt(0) || 'Y'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{data.personal.name || 'Your Name'}</div>
          {data.experience[0] && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{data.experience[0].role}</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 8 }}>Contact</div>
          {data.personal.email && <div style={{ fontSize: 11, marginBottom: 4, wordBreak: 'break-all' }}>{data.personal.email}</div>}
          {data.personal.phone && <div style={{ fontSize: 11, marginBottom: 4 }}>{data.personal.phone}</div>}
          {data.personal.location && <div style={{ fontSize: 11, marginBottom: 4 }}>{data.personal.location}</div>}
          {data.personal.Link2 && <div style={{ fontSize: 11, marginBottom: 4, wordBreak: 'break-all' }}>{data.personal.Link2}</div>}
          {data.personal.website && <div style={{ fontSize: 11, wordBreak: 'break-all' }}>{data.personal.website}</div>}
        </div>
        {data.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 8 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 4, padding: '3px 8px', fontSize: 11 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Right main */}
      <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.summary && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #6366f1', paddingBottom: 4, marginBottom: 8 }}>Summary</div>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
          </div>
        )}
        {data.experience.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #6366f1', paddingBottom: 4, marginBottom: 10 }}>Experience</div>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{exp.role}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{exp.duration}</div>
                </div>
                <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 4 }}>{exp.company}</div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.55, margin: 0 }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #6366f1', paddingBottom: 4, marginBottom: 10 }}>Education</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{edu.degree}</div>
                <div style={{ fontSize: 12, color: '#6366f1' }}>{edu.institution}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{edu.year}{edu.gpa ? ` - GPA: ${edu.gpa}` : ''}</div>
              </div>
            ))}
          </div>
        )}
        {data.projects.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #6366f1', paddingBottom: 4, marginBottom: 10 }}>Projects</div>
            {data.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{proj.name}</div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.55, margin: '2px 0' }}>{proj.description}</p>
                <div style={{ fontSize: 11, color: '#6366f1' }}>{proj.tech}</div>
                {proj.link && <div style={{ fontSize: 11, color: '#6b7280' }}>{proj.link}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
