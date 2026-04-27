import type { ResumeData } from '../types';

interface TemplateProps {
  data: ResumeData;
}

export default function ClassicTemplate({ data }: TemplateProps) {
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', padding: '40px 48px', background: '#fff', minHeight: '297mm', color: '#1a1a1a' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{data.personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 12, color: '#444', marginTop: 6, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.location && <span>{data.personal.location}</span>}
          {data.personal.Link2 && <span>{data.personal.Link2}</span>}
        </div>
      </div>
      {data.summary && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Professional Summary</div>
          <p style={{ fontSize: 12, lineHeight: 1.65, color: '#333', margin: 0 }}>{data.summary}</p>
        </div>
      )}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #999', paddingBottom: 4, marginBottom: 10 }}>Work Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{exp.role} - {exp.company}</div>
                <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>{exp.duration}</div>
              </div>
              <p style={{ fontSize: 12, color: '#333', lineHeight: 1.6, marginTop: 4, margin: 0 }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #999', paddingBottom: 4, marginBottom: 10 }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{edu.degree}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{edu.institution}</div>
              </div>
              <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>{edu.year}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #999', paddingBottom: 4, marginBottom: 8 }}>Skills</div>
          <p style={{ fontSize: 12, color: '#333', lineHeight: 1.7, margin: 0 }}>{data.skills.join(' | ')}</p>
        </div>
      )}
      {data.projects.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #999', paddingBottom: 4, marginBottom: 10 }}>Projects</div>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{proj.name} <span style={{ fontWeight: 400, fontSize: 12, color: '#555' }}>({proj.tech})</span></div>
              <p style={{ fontSize: 12, color: '#333', lineHeight: 1.6, marginTop: 2, margin: 0 }}>{proj.description}</p>
              {proj.link && <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>{proj.link}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
