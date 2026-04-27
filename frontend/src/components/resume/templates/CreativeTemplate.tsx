import type { ResumeData } from '../types';

interface TemplateProps {
  data: ResumeData;
}

export default function CreativeTemplate({ data }: TemplateProps) {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '297mm', background: '#fff' }}>
      {/* Sidebar */}
      <div style={{ width: '36%', background: 'linear-gradient(160deg, #0ea5e9 0%, #6366f1 100%)', color: '#fff', padding: '36px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{data.personal.name || 'Your Name'}</div>
          {data.experience[0] && <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6, fontWeight: 500 }}>{data.experience[0].role}</div>}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75, marginBottom: 10 }}>Contact</div>
          {data.personal.email && <div style={{ fontSize: 11, marginBottom: 5, wordBreak: 'break-all' }}>{data.personal.email}</div>}
          {data.personal.phone && <div style={{ fontSize: 11, marginBottom: 5 }}>{data.personal.phone}</div>}
          {data.personal.location && <div style={{ fontSize: 11, marginBottom: 5 }}>{data.personal.location}</div>}
          {data.personal.Link2 && <div style={{ fontSize: 11, wordBreak: 'break-all' }}>{data.personal.Link2}</div>}
        </div>
        {data.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75, marginBottom: 10 }}>Skills</div>
            {data.skills.map((s, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, marginBottom: 3 }}>{s}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${70 + (i % 3) * 10}%`, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75, marginBottom: 10 }}>Education</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{edu.degree}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{edu.institution}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.summary && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>About Me</div>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.65, margin: 0 }}>{data.summary}</p>
          </div>
        )}
        {data.experience.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Experience</div>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid #e0f2fe' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{exp.role}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 600 }}>{exp.company}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{exp.duration}</div>
                </div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}
        {data.projects.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Projects</div>
            {data.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #e0f2fe' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{proj.name}</div>
                <div style={{ fontSize: 11, color: '#0ea5e9', marginBottom: 3 }}>{proj.tech}</div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{proj.description}</p>
                {proj.link && <div style={{ fontSize: 11, color: '#94a3b8' }}>{proj.link}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
