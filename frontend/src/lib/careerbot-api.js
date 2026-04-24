const envApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE = (envApiBase?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

export async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map((x) => x.str).join(" ") + "\n";
  }
  return out.trim();
}

export async function runAgent(messages, onStatus, onCourses) {
  const r = await fetch(`${API_BASE}/careerbot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) throw new Error(`Backend Error ${r.status}`);
  const data = await r.json();
  
  if (data.events && onStatus) {
    data.events.forEach(e => {
      if (e.type === 'status') onStatus(e.message);
    });
  }
  if (data.courses && onCourses) {
    onCourses(data.courses);
  }
  
  return data.reply;
}

export async function analyzeATS(resumeText, jobDesc = "") {
  const r = await fetch(`${API_BASE}/careerbot/analyze-ats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDesc }),
  });
  if (!r.ok) throw new Error(`Backend Error ${r.status}`);
  return r.json();
}

export async function findCoursesOnline(topic) {
  const r = await fetch(`${API_BASE}/careerbot/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  if (!r.ok) throw new Error(`Backend Error ${r.status}`);
  const data = await r.json();
  return data.courses || [];
}

export async function callLLM(history) {
  const r = await fetch(`${API_BASE}/careerbot/simple-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  if (!r.ok) throw new Error(`Backend Error ${r.status}`);
  const data = await r.json();
  // HelpBot expects { choices: [{ message: { content: ... } }] }
  return { choices: [{ message: { content: data.reply } }] };
}

// localStorage helpers for chat sessions
const STORAGE_KEY = "careerbot-sessions";

export function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createSession(title) {
  return { id: Date.now().toString(), title: title || "New Chat", messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

// Simple markdown-like rendering
export function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^### (.+)$/gm, '<strong style="font-size:14px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="font-size:15px">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong style="font-size:16px">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
