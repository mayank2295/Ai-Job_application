const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : (typeof import.meta !== 'undefined' && import.meta.env?.DEV
        ? 'http://localhost:3001/api'
        : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');
let pdfjsModulePromise = null;

async function getPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]).then(([pdfjsLib, worker]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjsLib;
    });
  }
  return pdfjsModulePromise;
}

async function backendPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let d;
  try { d = JSON.parse(text); } catch { throw new Error(text); }
  if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
  return d;
}

export async function extractPdfText(file) {
  const pdfjsLib = await getPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map(x => x.str).join(' ') + '\n';
  }
  const trimmed = out.trim();
  if (!trimmed) {
    throw new Error("No text could be extracted from this PDF. It might be an image-based scan.");
  }
  return trimmed;
}

export async function runAgent(messages, onStatus, onCourses, onProfiles) {
  const data = await backendPost('/careerbot/chat', { messages });
  if (data.events) data.events.forEach(e => { if (e.type === 'status' && onStatus) onStatus(e.message); });
  if (data.courses && onCourses) onCourses(data.courses);
  if (data.profiles && onProfiles) onProfiles(data.profiles);
  return data.reply;
}

export async function analyzeATS(resumeText, jobDesc = '') {
  return backendPost('/careerbot/analyze-ats', { resumeText, jobDesc });
}

export async function findCoursesOnline(topic) {
  const data = await backendPost('/careerbot/courses', { topic });
  return data.courses || [];
}

export async function webSearch(query) {
  return backendPost('/careerbot/search', { query, depth: 'advanced' });
}

export async function scrapeProfiles(query) {
  return backendPost('/careerbot/profiles', { query });
}

export async function optimizeLinkedin(resumeText, targetRole) {
  return backendPost('/ai/linkedin-optimizer', { resumeText, targetRole });
}

export async function callLLM(history) {
  const data = await backendPost('/careerbot/simple-chat', { history });
  return { choices: [{ message: { content: data.reply } }] };
}

// --- Session helpers ---
export async function loadSessions(userId, botType = 'careerbot') {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/careerbot/sessions?user_id=${userId}&bot_type=${botType}`);
    if (!res.ok) return [];
    const data = await res.json();
    const sessions = Array.isArray(data) ? data : (data.sessions || []);
    return sessions.map(s => ({
      id: s.id,
      title: s.title,
      messages: typeof s.messages === 'string' ? JSON.parse(s.messages) : (s.messages || []),
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
  } catch (err) {
    console.error('Error loading sessions:', err);
    return [];
  }
}

export async function saveSession(userId, session, botType = 'careerbot') {
  if (!userId || !session) return;
  try {
    await backendPost('/careerbot/sessions', {
      id: session.id,
      user_id: userId,
      bot_type: botType,
      title: session.title,
      messages: session.messages
    });
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export async function deleteSession(sessionId) {
  try {
    await fetch(`${API_BASE}/careerbot/sessions/${sessionId}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
}

export function createSession(title) {
  return { id: Date.now().toString(), title: title || 'New Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

// --- Markdown renderer ---
export function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.+)$/gm, '<strong style="font-size:14px;display:block;margin:10px 0 4px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="font-size:15px;display:block;margin:12px 0 6px">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong style="font-size:16px;display:block;margin:14px 0 6px">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
