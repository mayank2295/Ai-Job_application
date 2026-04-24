const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-4o-mini";

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

export async function tavilySearch(query, depth = "basic") {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: TAVILY_API_KEY, query, search_depth: depth, max_results: 6, include_answer: true }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}`);
  return r.json();
}

export async function findCoursesOnline(topic) {
  const [udemy, coursera] = await Promise.all([
    tavilySearch(`udemy course ${topic} best rated 2024`, "advanced"),
    tavilySearch(`coursera course ${topic} certificate 2024`, "advanced"),
  ]);
  return [
    ...(udemy.results || []).slice(0, 4).map((r) => ({ ...r, platform: "Udemy" })),
    ...(coursera.results || []).slice(0, 4).map((r) => ({ ...r, platform: "Coursera" })),
  ];
}

export async function callLLM(messages, tools = null) {
  const body = { model: MODEL, messages, max_tokens: 1500, ...(tools ? { tools, tool_choice: "auto" } : {}) };
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "AI Career Assistant",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
  return r.json();
}

const TOOLS = [
  { type: "function", function: { name: "web_search", description: "Search the web for current news, facts, or any real-time information.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } } },
  { type: "function", function: { name: "find_courses", description: "Find online courses on Udemy or Coursera for a given skill or topic.", parameters: { type: "object", properties: { topic: { type: "string", description: "Skill or topic to find courses for" } }, required: ["topic"] } } },
];

export async function runAgent(messages, onStatus, onCourses) {
  const msgs = [...messages];
  for (let round = 0; round < 6; round++) {
    const data = await callLLM(msgs, TOOLS);
    const msg = data.choices[0].message;
    if (!msg.tool_calls?.length) return msg.content || "";
    msgs.push(msg);
    for (const tc of msg.tool_calls) {
      let result = "";
      const args = JSON.parse(tc.function.arguments || "{}");
      if (tc.function.name === "web_search") {
        onStatus(`🔍 Searching: "${args.query}"…`);
        try {
          const d = await tavilySearch(args.query);
          result = JSON.stringify({ answer: d.answer, results: (d.results || []).slice(0, 4).map((x) => ({ title: x.title, snippet: (x.content || "").slice(0, 300), url: x.url })) });
        } catch (e) { result = JSON.stringify({ error: e.message }); }
      } else if (tc.function.name === "find_courses") {
        onStatus(`📚 Finding courses: "${args.topic}"…`);
        try {
          const courses = await findCoursesOnline(args.topic);
          onCourses?.(courses);
          result = JSON.stringify(courses.slice(0, 5).map((c) => ({ title: c.title, url: c.url, platform: c.platform })));
        } catch (e) { result = JSON.stringify({ error: e.message }); }
      }
      msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }
  const final = await callLLM(msgs, null);
  return final.choices[0].message.content || "";
}

export async function analyzeATS(resumeText, jobDesc = "") {
  const prompt = `You are an expert ATS resume analyst.\n${jobDesc ? `Target Job Description:\n${jobDesc.slice(0, 800)}\n\n` : ""}Resume Content:\n${resumeText.slice(0, 3500)}\n\nReturn ONLY raw JSON: {"overall_score":<0-100>,"keyword_score":<0-100>,"format_score":<0-100>,"content_score":<0-100>,"impact_score":<0-100>,"experience_years":<int|null>,"top_skills":[<up to 8>],"missing_keywords":[<up to 6>],"strengths":[<3>],"improvements":[<4>],"summary":"<2-3 sentences>"}`;
  const data = await callLLM([
    { role: "system", content: "You are an ATS expert. Respond ONLY with valid JSON." },
    { role: "user", content: prompt },
  ]);
  const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
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
