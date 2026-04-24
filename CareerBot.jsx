/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         AI CAREER ASSISTANT — CareerBot.jsx             ║
 * ║  Chat · Resume ATS · Course Finder · Voice I/O          ║
 * ║  OpenRouter (GPT-4o-mini) + Tavily Search               ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  Usage:  import CareerBot from "./CareerBot";
 *          <CareerBot />
 */

// ─── API CONFIG ────────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = "your_openrouter_api_key_here";
const TAVILY_API_KEY = "your_tavily_api_key_here";
const MODEL = "openai/gpt-4o-mini"; // fast, capable, great tool-use
// ──────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
//  UTILITY — PDF TEXT EXTRACTION (pdf.js via CDN)
// ══════════════════════════════════════════════════════════════
async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = res;
      s.onerror = rej;
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

// ══════════════════════════════════════════════════════════════
//  TAVILY SEARCH
// ══════════════════════════════════════════════════════════════
async function tavilySearch(query, depth = "basic") {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: depth,
      max_results: 6,
      include_answer: true,
    }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}`);
  return r.json();
}

async function findCoursesOnline(topic) {
  const [udemy, coursera] = await Promise.all([
    tavilySearch(`udemy course ${topic} best rated 2024`, "advanced"),
    tavilySearch(`coursera course ${topic} certificate 2024`, "advanced"),
  ]);
  return [
    ...(udemy.results || []).slice(0, 4).map((r) => ({ ...r, platform: "Udemy" })),
    ...(coursera.results || []).slice(0, 4).map((r) => ({ ...r, platform: "Coursera" })),
  ];
}

// ══════════════════════════════════════════════════════════════
//  OPENROUTER LLM CALL
// ══════════════════════════════════════════════════════════════
async function callLLM(messages, tools = null) {
  const body = {
    model: MODEL,
    messages,
    max_tokens: 1500,
    ...(tools ? { tools, tool_choice: "auto" } : {}),
  };
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

// ══════════════════════════════════════════════════════════════
//  TOOLS SCHEMA
// ══════════════════════════════════════════════════════════════
const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current news, facts, or any real-time information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_courses",
      description:
        "Find online courses on Udemy or Coursera for a given skill or topic.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Skill or topic to find courses for",
          },
        },
        required: ["topic"],
      },
    },
  },
];

// ══════════════════════════════════════════════════════════════
//  AGENT LOOP (auto tool-use)
// ══════════════════════════════════════════════════════════════
async function runAgent(messages, onStatus, onCourses) {
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
        onStatus(`🔍 Searching the web for "${args.query}"…`);
        try {
          const d = await tavilySearch(args.query);
          result = JSON.stringify({
            answer: d.answer,
            results: (d.results || []).slice(0, 4).map((x) => ({
              title: x.title,
              snippet: (x.content || "").slice(0, 300),
              url: x.url,
            })),
          });
        } catch (e) {
          result = JSON.stringify({ error: e.message });
        }
      } else if (tc.function.name === "find_courses") {
        onStatus(`📚 Searching Udemy & Coursera for "${args.topic}"…`);
        try {
          const courses = await findCoursesOnline(args.topic);
          onCourses?.(courses);
          result = JSON.stringify(
            courses.slice(0, 5).map((c) => ({
              title: c.title,
              url: c.url,
              platform: c.platform,
            }))
          );
        } catch (e) {
          result = JSON.stringify({ error: e.message });
        }
      }
      msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }
  const final = await callLLM(msgs, null);
  return final.choices[0].message.content || "";
}

// ══════════════════════════════════════════════════════════════
//  ATS RESUME ANALYSIS
// ══════════════════════════════════════════════════════════════
async function analyzeATS(resumeText, jobDesc = "") {
  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyst.

${jobDesc ? `Target Job Description:\n${jobDesc.slice(0, 800)}\n\n` : ""}Resume Content:\n${resumeText.slice(0, 3500)}

Return ONLY a raw JSON object (no markdown fences, no explanation) with this exact shape:
{
  "overall_score": <integer 0-100>,
  "keyword_score": <integer 0-100>,
  "format_score": <integer 0-100>,
  "content_score": <integer 0-100>,
  "impact_score": <integer 0-100>,
  "experience_years": <integer or null>,
  "top_skills": [<up to 8 skill strings>],
  "missing_keywords": [<up to 6 strings>],
  "strengths": [<3 strings>],
  "improvements": [<4 strings>],
  "summary": "<2-3 sentence executive summary of the resume>"
}`;
  const data = await callLLM([
    { role: "system", content: "You are an ATS expert. Respond ONLY with valid JSON." },
    { role: "user", content: prompt },
  ]);
  const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

// ══════════════════════════════════════════════════════════════
//  SCORE RING  (SVG circular progress)
// ══════════════════════════════════════════════════════════════
function ScoreRing({ score, size = 80, color = "#f59e0b", label }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2235" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ fill: "#f0eff5", fontSize: size * 0.22, fontWeight: 700, fontFamily: "inherit" }}>
          {score}
        </text>
      </svg>
      {label && <span style={{ fontSize: 10, color: "#7b7e9e", textAlign: "center", maxWidth: size }}>{label}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  COURSE CARD
// ══════════════════════════════════════════════════════════════
function CourseCard({ course }) {
  const isUdemy = course.platform === "Udemy";
  const accent = isUdemy ? "#a78bfa" : "#22d3ee";
  return (
    <a
      href={course.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: "block", textDecoration: "none",
        background: "#1c1e2e", border: `1px solid ${accent}30`,
        borderRadius: 12, padding: "14px 16px",
        transition: "transform 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accent}30`; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
          background: `${accent}20`, color: accent, padding: "2px 8px", borderRadius: 20,
        }}>
          {course.platform.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", lineHeight: 1.4, marginBottom: 6 }}>
        {course.title}
      </div>
      {course.content && (
        <div style={{ fontSize: 11, color: "#7b7e9e", lineHeight: 1.5 }}>
          {course.content.slice(0, 120)}…
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, color: accent, display: "flex", alignItems: "center", gap: 4 }}>
        <span>View Course</span>
        <span>→</span>
      </div>
    </a>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CareerBot() {
  const SYSTEM = `You are an expert AI career assistant. You can:
• Answer any question and search the web for current information
• Analyze resumes for ATS (Applicant Tracking System) scores and improvements
• Find Udemy and Coursera courses for specific skills and topics
• Give career advice, interview tips, and professional guidance

When the user uploads a resume, reference it in your answers.
Use the web_search tool for current facts and the find_courses tool when users ask about learning or courses.
Be concise, warm, and actionable.`;

  const [tab, setTab]               = useState("chat");   // chat | resume | courses
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState("");

  const [resume, setResume]         = useState(null);      // { name, text }
  const [atsData, setAtsData]       = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [jobDesc, setJobDesc]       = useState("");

  const [courses, setCourses]       = useState([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseLoading, setCourseLoading] = useState(false);

  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [voiceOn, setVoiceOn]       = useState(false);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const recognRef   = useRef(null);
  const fileRef     = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }, [input]);

  // Setup speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => { setInput((p) => p + e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognRef.current = rec;
  }, []);

  const toggleListen = () => {
    if (!recognRef.current) return alert("Speech recognition not supported in this browser.");
    if (listening) { recognRef.current.stop(); setListening(false); }
    else { recognRef.current.start(); setListening(true); }
  };

  const speakText = useCallback((text) => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 500));
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha"));
    if (preferred) u.voice = preferred;
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  // ─── File upload ──────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setStatus("📄 Reading file…");
    try {
      let text = "";
      if (file.type === "application/pdf") text = await extractPdfText(file);
      else text = await file.text();
      setResume({ name: file.name, text });
      setAtsData(null);
      setStatus("");
      setTab("resume");
    } catch (e) {
      setStatus("");
      alert("Could not read file: " + e.message);
    }
  };

  const onFileInput = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  // ─── ATS Analysis ─────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!resume) return;
    setAtsLoading(true);
    setAtsData(null);
    try {
      const d = await analyzeATS(resume.text, jobDesc);
      setAtsData(d);
    } catch (e) { alert("Analysis error: " + e.message); }
    finally { setAtsLoading(false); }
  };

  // ─── Course search ────────────────────────────────────────
  const handleFindCourses = async () => {
    if (!courseQuery.trim()) return;
    setCourseLoading(true);
    setCourses([]);
    try {
      const list = await findCoursesOnline(courseQuery);
      setCourses(list);
    } catch (e) { alert("Course search error: " + e.message); }
    finally { setCourseLoading(false); }
  };

  // ─── Send chat message ────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { role: "user", content: text, ts };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setStatus("Thinking…");

    const history = [
      { role: "system", content: SYSTEM + (resume ? `\n\nUser resume loaded: ${resume.name}\n---\n${resume.text.slice(0, 2500)}` : "") },
      ...next.map(({ role, content }) => ({ role, content })),
    ];

    try {
      const reply = await runAgent(
        history,
        setStatus,
        (list) => { setCourses(list); setTab("courses"); }
      );
      const botMsg = { role: "assistant", content: reply, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages((p) => [...p, botMsg]);
      speakText(reply);
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", content: `⚠️ Error: ${e.message}`, ts }]);
    } finally {
      setLoading(false);
      setStatus("");
    }
  }, [input, loading, messages, resume, speakText]);

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  const scoreColor = (s) =>
    s >= 80 ? "#34d399" : s >= 60 ? "#f59e0b" : s >= 40 ? "#fb923c" : "#f87171";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080a10; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252840; border-radius: 10px; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ripple { 0% { transform:scale(1); opacity:0.8; } 100% { transform:scale(1.8); opacity:0; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
        .msg-bubble { animation: fadeUp 0.25s ease; }
        .tab-btn:hover { background: #1e2235 !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .course-input:focus { border-color: #22d3ee !important; outline: none; }
        textarea:focus { border-color: #f59e0b !important; outline: none; }
        input:focus { border-color: #22d3ee !important; outline: none; }
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1a1040 0%, #080a10 60%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 16,
      }}>
        <div style={{
          width: "100%", maxWidth: 1060, height: "90vh", maxHeight: 860,
          display: "flex", borderRadius: 22,
          overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          border: "1px solid #1e2235",
        }}>

          {/* ═══════════ SIDEBAR ═══════════ */}
          <div style={{
            width: 220, flexShrink: 0, background: "#0d0f18",
            borderRight: "1px solid #1a1c2e", display: "flex",
            flexDirection: "column", padding: "24px 14px",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg,#f59e0b,#f97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>✦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#f0eff5", letterSpacing: "0.02em" }}>CareerAI</div>
                <div style={{ fontSize: 10, color: "#4a4d6a" }}>Powered by GPT-4o</div>
              </div>
            </div>

            {/* Nav tabs */}
            {[
              { id: "chat",    icon: "💬", label: "Chat",         sub: "Ask anything" },
              { id: "resume",  icon: "📄", label: "ATS Resume",   sub: resume ? resume.name.slice(0, 18) : "Upload & analyze" },
              { id: "courses", icon: "🎓", label: "Courses",      sub: courses.length ? `${courses.length} found` : "Udemy · Coursera" },
            ].map((t) => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
                width: "100%", background: tab === t.id ? "#1a1c2e" : "transparent",
                border: tab === t.id ? "1px solid #252840" : "1px solid transparent",
                borderRadius: 11, padding: "10px 12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
                transition: "background 0.15s",
              }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tab === t.id ? "#f0eff5" : "#7b7e9e" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: tab === t.id ? "#4a4d6a" : "#363852", marginTop: 1,
                    maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.sub}
                  </div>
                </div>
                {tab === t.id && <div style={{ marginLeft: "auto", width: 4, height: 20, borderRadius: 2, background: "#f59e0b" }} />}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "#1a1c2e", margin: "16px 0" }} />

            {/* Upload resume quick button */}
            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", background: "#1a1c2e",
              border: "1px dashed #2d3050", borderRadius: 11,
              padding: "10px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f59e0b")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2d3050")}
            >
              <span style={{ fontSize: 15 }}>📎</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7b7e9e" }}>Upload Resume</div>
                <div style={{ fontSize: 10, color: "#363852" }}>PDF · TXT · DOC</div>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={onFileInput} />

            {/* Voice toggle */}
            <button onClick={() => { setVoiceOn((p) => !p); window.speechSynthesis?.cancel(); }} style={{
              width: "100%", marginTop: 8, background: voiceOn ? "#1a2a1e" : "#1a1c2e",
              border: `1px solid ${voiceOn ? "#34d39940" : "#2d3050"}`,
              borderRadius: 11, padding: "10px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15 }}>{speaking ? "🔊" : voiceOn ? "🔉" : "🔇"}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: voiceOn ? "#34d399" : "#7b7e9e" }}>
                  Voice {voiceOn ? "ON" : "OFF"}
                </div>
                <div style={{ fontSize: 10, color: "#363852" }}>AI speaks replies</div>
              </div>
            </button>

            {/* Spacer + footer */}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: "#2a2c40", textAlign: "center", lineHeight: 1.6 }}>
              Tavily · OpenRouter<br />GPT-4o-mini
            </div>
          </div>

          {/* ═══════════ MAIN CONTENT ═══════════ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f1119", overflow: "hidden" }}>

            {/* ─── CHAT TAB ─── */}
            {tab === "chat" && (
              <>
                {/* Header */}
                <div style={{
                  padding: "16px 24px", borderBottom: "1px solid #1a1c2e",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#0d0f18",
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#f0eff5" }}>AI Chat Assistant</div>
                    <div style={{ fontSize: 11, color: "#4a4d6a", marginTop: 2 }}>
                      {resume ? `📄 ${resume.name} loaded ·` : ""} Web search + course finder enabled
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {messages.length > 0 && (
                      <button onClick={() => setMessages([])} style={{
                        background: "none", border: "1px solid #252840",
                        borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                        fontSize: 11, color: "#4a4d6a", fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f8717140"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#4a4d6a"; e.currentTarget.style.borderColor = "#252840"; }}
                      >
                        Clear
                      </button>
                    )}
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {messages.length === 0 && (
                    <div style={{ margin: "auto", textAlign: "center", color: "#3a3d55" }}>
                      <div style={{ fontSize: 44, marginBottom: 16 }}>✦</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#5a5e7a", marginBottom: 8 }}>Ready to help</div>
                      <div style={{ fontSize: 13, color: "#3a3d55", lineHeight: 1.8 }}>
                        Ask me anything · Upload your resume<br />
                        Find courses · Get career advice
                      </div>
                      {/* Quick prompts */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
                        {[
                          "Analyze my resume for ATS",
                          "Find Python courses on Udemy",
                          "What are hot tech skills in 2025?",
                          "Tips for a software engineer interview",
                        ].map((q) => (
                          <button key={q} onClick={() => setInput(q)} style={{
                            background: "#1a1c2e", border: "1px solid #252840",
                            borderRadius: 20, padding: "7px 14px",
                            fontSize: 12, color: "#7b7e9e", cursor: "pointer",
                            fontFamily: "inherit", transition: "all 0.15s",
                          }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#252840"; e.currentTarget.style.color = "#7b7e9e"; }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className="msg-bubble" style={{
                      display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                      alignItems: "flex-end", gap: 10,
                    }}>
                      {m.role === "assistant" && (
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg,#f59e0b,#f97316)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, marginBottom: 2,
                        }}>✦</div>
                      )}
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{
                          padding: "11px 16px",
                          background: m.role === "user"
                            ? "linear-gradient(135deg,#f59e0b20,#f9731620)"
                            : "#1c1e2e",
                          border: m.role === "user" ? "1px solid #f59e0b30" : "1px solid #252840",
                          borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          color: "#e8eaf0", fontSize: 13.5, lineHeight: 1.7,
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                        }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: 10, color: "#363852", marginTop: 4, textAlign: m.role === "user" ? "right" : "left" }}>
                          {m.ts}
                        </div>
                      </div>
                      {m.role === "user" && (
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          background: "#1c1e2e", border: "1px solid #252840",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                        }}>👤</div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="msg-bubble" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: "linear-gradient(135deg,#f59e0b,#f97316)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                      }}>✦</div>
                      <div style={{
                        background: "#1c1e2e", border: "1px solid #252840",
                        borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        {status && status !== "Thinking…" ? (
                          <>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #252840", borderTop: "2px solid #f59e0b", animation: "spin 0.7s linear infinite" }} />
                            <span style={{ fontSize: 12, color: "#7b7e9e", fontStyle: "italic" }}>{status}</span>
                          </>
                        ) : (
                          [0, 1, 2].map((j) => (
                            <div key={j} style={{
                              width: 7, height: 7, borderRadius: "50%", background: "#f59e0b",
                              animation: `bounce 1.2s infinite`, animationDelay: `${j * 0.18}s`,
                            }} />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1c2e", background: "#0d0f18" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    {/* Mic button */}
                    <button onClick={toggleListen} title="Voice input" style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: listening ? "#f59e0b20" : "#1c1e2e",
                      border: `1px solid ${listening ? "#f59e0b" : "#252840"}`,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, transition: "all 0.2s",
                    }}>
                      {listening ? (
                        <span style={{ animation: "pulse 1s infinite" }}>🎙️</span>
                      ) : "🎤"}
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKey}
                      disabled={loading}
                      placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      style={{
                        flex: 1, background: "#1c1e2e",
                        border: "1px solid #252840", borderRadius: 13,
                        padding: "11px 15px", color: "#e8eaf0",
                        fontSize: 13.5, fontFamily: "inherit", lineHeight: 1.55,
                        resize: "none", minHeight: 44, maxHeight: 130,
                        transition: "border-color 0.2s",
                      }}
                    />

                    {/* Send */}
                    <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading} style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: !input.trim() || loading
                        ? "#1c1e2e"
                        : "linear-gradient(135deg,#f59e0b,#f97316)",
                      border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", opacity: !input.trim() || loading ? 0.4 : 1,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ─── RESUME / ATS TAB ─── */}
            {tab === "resume" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f0eff5", marginBottom: 4 }}>ATS Resume Analyzer</div>
                <div style={{ fontSize: 12, color: "#4a4d6a", marginBottom: 24 }}>
                  Upload your resume and optionally paste a job description for targeted scoring.
                </div>

                {/* Drop zone */}
                {!resume ? (
                  <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: "2px dashed #2d3050", borderRadius: 16, padding: "48px 24px",
                      textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
                      background: "#0d0f18",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f59e0b")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2d3050")}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#7b7e9e" }}>Drop your resume here</div>
                    <div style={{ fontSize: 12, color: "#3a3d55", marginTop: 6 }}>or click to browse · PDF, TXT, DOC</div>
                  </div>
                ) : (
                  <div style={{ background: "#1c1e2e", border: "1px solid #252840", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0" }}>{resume.name}</div>
                        <div style={{ fontSize: 11, color: "#4a4d6a" }}>{Math.round(resume.text.length / 5)} words extracted</div>
                      </div>
                    </div>
                    <button onClick={() => { setResume(null); setAtsData(null); }} style={{
                      background: "none", border: "1px solid #f8717140", borderRadius: 8,
                      padding: "4px 10px", fontSize: 11, color: "#f87171", cursor: "pointer", fontFamily: "inherit",
                    }}>Remove</button>
                  </div>
                )}

                {resume && (
                  <>
                    {/* Job description */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#4a4d6a", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                        JOB DESCRIPTION (optional — for targeted scoring)
                      </label>
                      <textarea
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Paste the job description here for a more accurate ATS score…"
                        rows={4}
                        style={{
                          width: "100%", background: "#1c1e2e", border: "1px solid #252840",
                          borderRadius: 12, padding: "11px 14px", color: "#e8eaf0",
                          fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, resize: "none",
                          transition: "border-color 0.2s",
                        }}
                      />
                    </div>

                    <button className="action-btn" onClick={handleAnalyze} disabled={atsLoading} style={{
                      background: atsLoading ? "#1c1e2e" : "linear-gradient(135deg,#f59e0b,#f97316)",
                      border: "none", borderRadius: 12, padding: "12px 28px",
                      color: "white", fontSize: 13, fontWeight: 700,
                      cursor: atsLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.15s", marginBottom: 28,
                    }}>
                      {atsLoading
                        ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #ffffff40", borderTop: "2px solid white", animation: "spin 0.7s linear infinite" }} /> Analyzing…</>
                        : "⚡ Analyze Resume"}
                    </button>
                  </>
                )}

                {/* ATS Results */}
                {atsData && (
                  <div style={{ animation: "fadeUp 0.4s ease" }}>
                    {/* Scores row */}
                    <div style={{
                      display: "flex", gap: 20, flexWrap: "wrap",
                      background: "#1c1e2e", border: "1px solid #252840",
                      borderRadius: 16, padding: "24px 28px", marginBottom: 20,
                      justifyContent: "space-around", alignItems: "center",
                    }}>
                      <ScoreRing score={atsData.overall_score} size={96} color={scoreColor(atsData.overall_score)} label="Overall ATS" />
                      <ScoreRing score={atsData.keyword_score}  size={72} color="#22d3ee" label="Keywords" />
                      <ScoreRing score={atsData.format_score}   size={72} color="#a78bfa" label="Format" />
                      <ScoreRing score={atsData.content_score}  size={72} color="#34d399" label="Content" />
                      <ScoreRing score={atsData.impact_score}   size={72} color="#fb923c" label="Impact" />
                    </div>

                    {/* Summary */}
                    {atsData.summary && (
                      <div style={{ background: "#1c1e2e", border: "1px solid #252840", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", marginBottom: 8 }}>EXECUTIVE SUMMARY</div>
                        <div style={{ fontSize: 13, color: "#b0b3cc", lineHeight: 1.7 }}>{atsData.summary}</div>
                        {atsData.experience_years !== null && atsData.experience_years !== undefined && (
                          <div style={{ marginTop: 10, display: "inline-block", background: "#f59e0b15", border: "1px solid #f59e0b30", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#f59e0b" }}>
                            ~{atsData.experience_years} years experience detected
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2-col grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                      {/* Strengths */}
                      <div style={{ background: "#1c1e2e", border: "1px solid #34d39920", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", letterSpacing: "0.1em", marginBottom: 12 }}>✅ STRENGTHS</div>
                        {(atsData.strengths || []).map((s, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#b0b3cc", lineHeight: 1.6, marginBottom: 6, display: "flex", gap: 8 }}>
                            <span style={{ color: "#34d399", flexShrink: 0 }}>•</span>{s}
                          </div>
                        ))}
                      </div>
                      {/* Improvements */}
                      <div style={{ background: "#1c1e2e", border: "1px solid #f8717120", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: "0.1em", marginBottom: 12 }}>🔧 IMPROVEMENTS</div>
                        {(atsData.improvements || []).map((s, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#b0b3cc", lineHeight: 1.6, marginBottom: 6, display: "flex", gap: 8 }}>
                            <span style={{ color: "#f87171", flexShrink: 0 }}>•</span>{s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills + Missing keywords */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ background: "#1c1e2e", border: "1px solid #252840", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 12 }}>🛠 TOP SKILLS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(atsData.top_skills || []).map((s, i) => (
                            <span key={i} style={{ fontSize: 11, background: "#a78bfa15", border: "1px solid #a78bfa30", color: "#a78bfa", borderRadius: 20, padding: "3px 10px" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: "#1c1e2e", border: "1px solid #252840", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#fb923c", letterSpacing: "0.1em", marginBottom: 12 }}>❌ MISSING KEYWORDS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(atsData.missing_keywords || []).map((s, i) => (
                            <span key={i} style={{ fontSize: 11, background: "#fb923c15", border: "1px solid #fb923c30", color: "#fb923c", borderRadius: 20, padding: "3px 10px" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── COURSES TAB ─── */}
            {tab === "courses" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f0eff5", marginBottom: 4 }}>Course Finder</div>
                <div style={{ fontSize: 12, color: "#4a4d6a", marginBottom: 24 }}>
                  Search Udemy & Coursera for any skill or topic.
                </div>

                {/* Search bar */}
                <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                  <input
                    className="course-input"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFindCourses()}
                    placeholder="e.g. Machine Learning, React, Data Science…"
                    style={{
                      flex: 1, background: "#1c1e2e", border: "1px solid #252840",
                      borderRadius: 12, padding: "11px 16px", color: "#e8eaf0",
                      fontSize: 13.5, fontFamily: "inherit", transition: "border-color 0.2s",
                    }}
                  />
                  <button className="action-btn" onClick={handleFindCourses} disabled={!courseQuery.trim() || courseLoading} style={{
                    background: !courseQuery.trim() || courseLoading ? "#1c1e2e" : "linear-gradient(135deg,#22d3ee,#06b6d4)",
                    border: "none", borderRadius: 12, padding: "11px 22px",
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: !courseQuery.trim() || courseLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                    opacity: !courseQuery.trim() || courseLoading ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}>
                    {courseLoading
                      ? <><div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #ffffff40", borderTop: "2px solid white", animation: "spin 0.7s linear infinite" }} /> Searching</>
                      : "🔍 Search"}
                  </button>
                </div>

                {courses.length === 0 && !courseLoading && (
                  <div style={{ textAlign: "center", color: "#3a3d55", paddingTop: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#4a4d6a" }}>Search for a topic to find courses</div>
                    <div style={{ fontSize: 12, color: "#3a3d55", marginTop: 6 }}>
                      Or ask the chatbot: "Find me React courses"
                    </div>
                    {/* Quick topics */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
                      {["Python", "Machine Learning", "UI/UX Design", "Data Science", "React", "Cloud AWS"].map((t) => (
                        <button key={t} onClick={() => setCourseQuery(t)} style={{
                          background: "#1c1e2e", border: "1px solid #252840",
                          borderRadius: 20, padding: "6px 14px",
                          fontSize: 12, color: "#7b7e9e", cursor: "pointer",
                          fontFamily: "inherit", transition: "all 0.15s",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#22d3ee"; e.currentTarget.style.color = "#22d3ee"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#252840"; e.currentTarget.style.color = "#7b7e9e"; }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {courses.length > 0 && (
                  <div>
                    {/* Platform filter badges */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#4a4d6a" }}>
                        {courses.length} courses found
                      </span>
                      <span style={{ fontSize: 11, background: "#a78bfa20", color: "#a78bfa", border: "1px solid #a78bfa30", borderRadius: 20, padding: "2px 10px" }}>
                        Udemy: {courses.filter((c) => c.platform === "Udemy").length}
                      </span>
                      <span style={{ fontSize: 11, background: "#22d3ee20", color: "#22d3ee", border: "1px solid #22d3ee30", borderRadius: 20, padding: "2px 10px" }}>
                        Coursera: {courses.filter((c) => c.platform === "Coursera").length}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {courses.map((c, i) => <CourseCard key={i} course={c} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
