import { useState, useRef, useEffect, useCallback } from "react";
import { extractPdfText, runAgent, analyzeATS, findCoursesOnline, callLLM, loadSessions, saveSession, deleteSession, createSession, renderMarkdown, optimizeLinkedin } from "../lib/careerbot-api";
import WebSearchTab from "./WebSearchTab";
import { useAuth } from "../context/AuthContext";

function ScoreRing({ score, size = 80, color = "#6366f1", label }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} className="cb-score-ring">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-primary)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", transition:"stroke-dashoffset 1s ease" }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: size*0.22, fontWeight:700, fontFamily:"inherit" }}>{score}</text>
      </svg>
      {label && <span style={{ fontSize:10, color:"var(--text-muted)", textAlign:"center" }}>{label}</span>}
    </div>
  );
}

export default function CareerBot({ initialTab = "chat" }) {
const SYSTEM = `You are a highly intelligent AI assistant and expert career coach.

Your capabilities:
- Deep expertise in software engineering, AI/ML, data science, product management, design, and career guidance
- Real-time web search for latest information (use web_search tool)
- Find online courses on Udemy/Coursera (use find_courses tool)
- Search and rank professionals/experts (use scrape_profiles tool)
- Resume ATS analysis and optimization
- Interview prep, salary negotiation, career path advice

Response strategy:
1. Understand user intent deeply - ask a clarifying question if the request is ambiguous
2. Give practical, real-world solutions - not theory
3. Provide step-by-step guidance with examples
4. For coding: write clean, production-ready code with comments and suggest optimizations
5. For learning queries: start simple, go deeper, then summarize at the end
6. For product/architecture: think like a senior engineer and suggest scalability improvements
7. When voice mode is active: keep responses shorter and conversational

Rules:
- ALWAYS use the web_search tool when the user asks to "search online", asks for current events, latest salaries, job trends, or real-time data.
- Use find_courses when the user wants to learn a skill
- Use scrape_profiles when user asks for people, experts, or Link2 profiles
- Format responses with markdown: bold key points, use bullet lists, use code blocks for code
- Be clear, confident, and practical - never robotic
- If unsure, say so clearly and suggest how the user can verify`;


  const { user } = useAuth();
  const userId = user?.id || user?.firebaseUser?.uid || 'anonymous';

  const [tab, setTab] = useState(initialTab);
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      const s = await loadSessions(userId, 'careerbot');
      if (s.length) {
        setSessions(s);
        setActiveSessionId(s[0].id);
      } else {
        const initial = createSession("New Chat");
        setSessions([initial]);
        setActiveSessionId(initial.id);
        await saveSession(userId, initial, 'careerbot');
      }
      setSessionsLoaded(true);
    }
    init();
  }, [userId]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [editIdx, setEditIdx] = useState(-1);
  const [editText, setEditText] = useState("");
  const [resume, setResume] = useState(null);
  const [chatDocuments, setChatDocuments] = useState([]);
  const [atsData, setAtsData] = useState(() => {
    // Restore last ATS result from localStorage
    try {
      const saved = localStorage.getItem('jobflow_ats_last_result');
      if (saved) return JSON.parse(saved).result;
    } catch {}
    return null;
  });
  const [atsLoading, setAtsLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [showJD, setShowJD] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseLoading, setCourseLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [linkedinRole, setLinkedinRole] = useState("");
  const [linkedinResult, setLinkedinResult] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const recognRef = useRef(null);
  const fileRef = useRef(null);
  const jdFileRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || { messages: [] };
  const messages = activeSession.messages || [];

  const updateMessages = useCallback((newMsgs) => {
    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === activeSessionId) {
          const updatedSession = { ...s, messages: typeof newMsgs === 'function' ? newMsgs(s.messages) : newMsgs, updatedAt: new Date().toISOString() };
          saveSession(userId, updatedSession, 'careerbot');
          return updatedSession;
        }
        return s;
      });
      return next;
    });
  }, [activeSessionId, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { const el = textareaRef.current; if(!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight,130)+"px"; }, [input]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return;
    const rec = new SR(); rec.continuous=false; rec.interimResults=false; rec.lang="en-US";
    rec.onresult = (e) => { setInput(p => p + e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognRef.current = rec;
  }, []);

  const toggleListen = () => { if(!recognRef.current) return alert("Speech recognition not supported in this browser."); if(listening) { recognRef.current.stop(); setListening(false); } else { recognRef.current.start(); setListening(true); } };

  // Text-to-Speech: reads AI reply aloud when voice mode is on
  const speak = (text) => {
    if(!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`>_~[\]()]/g, '').replace(/\n+/g, ' ').slice(0, 600);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.45; utt.pitch = 1; utt.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.lang === 'en-US');
    if(preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  };

  const handleFile = async (file) => {
    if(!file) return;
    try { 
      let text = file.type === "application/pdf" ? await extractPdfText(file) : await file.text(); 
      if (tab === "chat") {
        const newDoc = { name: file.name, text };
        setChatDocuments(prev => [...prev, newDoc]);
        // Just add a silent user message so AI has the content in history
        // but don't auto-trigger a response — let the user ask their question
        const ts = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
        const docMsg = { 
          role: "user", 
          content: `I've uploaded my document "${file.name}". Here is the full content:\n\n${text.slice(0, 6000)}${text.length > 6000 ? '\n\n[Document truncated for length]' : ''}`, 
          ts,
          isDocUpload: true
        };
        // Add a simple assistant acknowledgment without calling the API
        const ackMsg = {
          role: "assistant",
          content: `📄 Got it! I've read **${file.name}** (${Math.round(text.length / 5)} words). What would you like to know about it?`,
          ts: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
        };
        updateMessages(prev => [...prev, docMsg, ackMsg]);
      } else {
        setResume({ name: file.name, text }); 
        setAtsData(null); 
      }
    } catch(e) { alert("Could not read file: " + e.message); }
  };

  const handleJDFile = async (file) => {
    if(!file) return;
    try { let text = file.type === "application/pdf" ? await extractPdfText(file) : await file.text(); setJobDesc(text); } catch(e) { alert("Could not read JD file: " + e.message); }
  };

  const handleAnalyze = async () => {
    if(!resume) return; setAtsLoading(true); setAtsData(null);
    try {
      const result = await analyzeATS(resume.text, jobDesc);
      setAtsData(result);
      // Persist to localStorage so result survives page refresh
      try { localStorage.setItem('jobflow_ats_last_result', JSON.stringify({ result, resumeName: resume.name, analyzedAt: new Date().toISOString() })); } catch {}
    } catch(e) { alert("Analysis error: " + e.message); }
    finally { setAtsLoading(false); }
  };

  const handleFindCourses = async () => {
    if(!courseQuery.trim()) return; setCourseLoading(true); setCourses([]);
    try { setCourses(await findCoursesOnline(courseQuery)); } catch(e) { alert("Course search error: " + e.message); }
    finally { setCourseLoading(false); }
  };

  const newSession = () => {
    const s = createSession("New Chat");
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
    saveSession(userId, s, 'careerbot');
  };

  const switchSession = (id) => { setActiveSessionId(id); setTab("chat"); };

  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if(!next.length) {
        const s = createSession("New Chat");
        next.push(s);
        saveSession(userId, s, 'careerbot');
      }
      if(activeSessionId === id) setActiveSessionId(next[0].id);
      return next;
    });
    deleteSession(id);
  };

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if(!text || loading) return;
    const ts = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const userMsg = { role:"user", content:text, ts };
    const next = [...messages, userMsg];
    updateMessages(next);
    if(!overrideText) setInput("");
    setLoading(true); setStatus("CareerAI is thinking...");

    if(messages.length === 0) {
      setSessions(prev => {
        const n = prev.map(s => {
          if (s.id === activeSessionId) {
            const updated = { ...s, title: text.slice(0,40) };
            saveSession(userId, updated, 'careerbot');
            return updated;
          }
          return s;
        });
        return n;
      });
    }

    const docContext = chatDocuments.length > 0 
      ? "\n\nNote: The user has uploaded documents. Their content is already in the conversation history above."
      : "";

    const history = [
      { role:"system", content: SYSTEM + (resume ? `\n\nResume loaded: ${resume.name}\n---\n${resume.text.slice(0,2500)}` : "") + docContext + (jobDesc ? `\n\nTarget Job Description:\n${jobDesc.slice(0,1500)}` : "") },
      ...next.map(({ role, content }) => ({ role, content })),
    ];
    try {
      const reply = await runAgent(
        history, 
        setStatus, 
        (list) => { setCourses(list); }, 
        (profiles) => { /* profiles handled by LLM response now */ }
      );
      updateMessages(p => [...p, { role:"assistant", content:reply, ts: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) }]);
      speak(reply); // read aloud if voice mode is on
    } catch(e) {
      updateMessages(p => [...p, { role:"assistant", content:`⚠️ Error: ${e.message}`, ts }]);
    } finally { setLoading(false); setStatus(""); }
  }, [input, loading, messages, resume, jobDesc, updateMessages, activeSessionId]);

  const handleEdit = (idx) => { setEditIdx(idx); setEditText(messages[idx].content); };
  const cancelEdit = () => { setEditIdx(-1); setEditText(""); };
  const saveEdit = async (idx) => {
    const trimmed = editText.trim(); if(!trimmed) return;
    const newMsgs = messages.slice(0, idx);
    newMsgs.push({ ...messages[idx], content: trimmed });
    updateMessages(newMsgs);
    setEditIdx(-1); setEditText("");
    // Re-send from this point
    setTimeout(() => sendMessage(trimmed), 100);
  };

  const copyText = (text) => { navigator.clipboard.writeText(text); };
  const exportChat = () => {
    const text = messages.map(m => `[${m.ts}] ${m.role === "user" ? "You" : "CareerAI"}: ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type:"text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "careerbot-chat.txt"; a.click();
  };

  const onKey = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const scoreColor = (s) => s >= 80 ? "var(--accent-emerald)" : s >= 60 ? "var(--accent-amber)" : s >= 40 ? "#fb923c" : "var(--accent-rose)";

  return (
    <div className="cb-container">
      {/* Sessions Sidebar */}
      <div className="cb-sessions">
        <div className="cb-sessions-header">
          <h3>💬 Chats</h3>
          <button className="btn btn-sm btn-primary" onClick={newSession} style={{padding:"4px 10px",fontSize:11}}>+ New</button>
        </div>
        <div className="cb-sessions-list">
          {sessions.map(s => (
            <button key={s.id} className={`cb-session-item ${s.id === activeSessionId ? "active" : ""}`} onClick={() => switchSession(s.id)} style={{position:"relative"}}
              onMouseEnter={() => setHoveredSessionId(s.id)}
              onMouseLeave={() => setHoveredSessionId(null)}
            >
              <div className="title">{s.title}</div>
              <div className="time">{new Date(s.updatedAt).toLocaleDateString()}</div>
              {sessions.length > 1 && hoveredSessionId === s.id && (
                <span
                  className="cb-session-delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                >
                  &#x2715;
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="cb-main">
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-left">
            <div className="cb-header-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <div className="cb-header-info">
              <h2>CareerAI Assistant</h2>
              <div className="cb-header-status">
                <span className="dot" />{tab === 'chat' && chatDocuments.length > 0 ? `${chatDocuments.length} doc(s) loaded` : tab === 'resume' && resume ? `📄 ${resume.name} loaded` : "Ready"}{jobDesc ? " · JD loaded" : ""}
              </div>
            </div>
          </div>
          <div className="cb-header-actions">
            {jobDesc && <span className="jd-badge">✓ JD Active</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => setShowJD(!showJD)} style={{padding:"6px 12px", fontSize:12, gap:5}}>
              📋 {showJD ? "Hide JD" : "Add JD"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setVoiceOn(p => !p)} style={{padding:"6px 12px", fontSize:12, gap:5, color: voiceOn ? "var(--accent-emerald)" : undefined}}>
              {voiceOn ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
            {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={exportChat} style={{padding:"6px 12px", fontSize:12, gap:5}}>📥 Export</button>}
          </div>
        </div>

        {/* JD Panel */}
        {showJD && (
          <div className="cb-jd-panel">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",letterSpacing:"0.08em"}}>JOB DESCRIPTION</label>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-sm btn-secondary" onClick={() => jdFileRef.current?.click()} style={{padding:"4px 12px",fontSize:11}}>📎 Upload JD File</button>
                {jobDesc && <button className="btn btn-sm btn-danger" onClick={() => setJobDesc("")} style={{padding:"4px 10px",fontSize:11}}>✕ Clear</button>}
              </div>
            </div>
            <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste the job description here - AI will tailor responses to this role..." rows={4} />
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Tip: Adding a JD makes resume analysis and interview prep much more accurate.</div>
            <input ref={jdFileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{display:"none"}} onChange={e => handleJDFile(e.target.files[0])} />
          </div>
        )}

        {/* Tabs - Hidden, controlled by Sidebar */}


        {/* Chat Tab */}
        {tab === "chat" && (<>
          <div className="cb-messages">
            {messages.length === 0 && (
              <div className="cb-empty">
                <div className="cb-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary-light)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
                <h3>Ready to help your career</h3>
                <p>Ask anything · Upload your resume · Find courses · Get career advice</p>
                <div className="cb-quick-prompts">
                  {["Analyze my resume for ATS","Find Python courses","Hot tech skills in 2025?","Interview tips for SDE"].map(q => (
                    <button key={q} className="cb-quick-prompt" onClick={() => setInput(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`cb-msg ${m.role}`}>
                <div className="cb-msg-avatar">{m.role === "assistant" ? "✦" : "👤"}</div>
                <div className="cb-msg-body">
                  {editIdx === i ? (
                    <div>
                      <textarea className="cb-edit-area" value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus />
                      <div className="cb-edit-btns">
                        <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button>
                        <button className="btn btn-sm btn-primary" onClick={() => saveEdit(i)}>Save & Resend</button>
                      </div>
                    </div>
                  ) : (
                    <div className="cb-msg-bubble" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.isDocUpload ? `📄 Uploaded: **${m.content.split('"')[1] || 'document'}**` : m.content) }} />
                  )}
                  <div className="cb-msg-meta">
                    <span>{m.ts}</span>
                    <div className="cb-msg-actions">
                      {m.role === "user" && editIdx !== i && <button className="cb-msg-action-btn" onClick={() => handleEdit(i)} title="Edit">✏️</button>}
                      {m.role === "assistant" && <button className="cb-msg-action-btn" onClick={() => copyText(m.content)} title="Copy">📋</button>}
                    </div>
                  </div>
                  {/* Quick actions removed — user can navigate to dedicated sections */}
                </div>
              </div>
            ))}

            {loading && (
              <div className="cb-typing">
                <div className="cb-msg-avatar" style={{background:"var(--gradient-primary)",color:"white",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✦</div>
                <div>
                  <div className="cb-typing-dots"><span/><span/><span/></div>
                  {status && <div className="cb-typing-status">{status}</div>}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

            <div className="cb-input-area">
              {chatDocuments.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", padding: "0 10px" }}>
                  {chatDocuments.map((doc, i) => (
                    <div key={i} style={{ fontSize: 11, background: "rgba(99,102,241,0.1)", color: "var(--accent-primary-light)", padding: "4px 8px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      📄 {doc.name.slice(0, 15)}...
                      <span style={{ cursor: "pointer", opacity: 0.7 }} onClick={() => setChatDocuments(p => p.filter((_, idx) => idx !== i))}>✕</span>
                    </div>
                  ))}
                </div>
              )}
            <div className="cb-input-row">
              <button className={`cb-icon-btn ${listening ? "active-mic" : ""}`} onClick={toggleListen} title="Voice input" style={{minWidth:44, fontSize:11, flexDirection:"column", gap:2}}>
                🎤
                <span style={{fontSize:9, color:"var(--text-muted)"}}>Voice</span>
              </button>
              <button className="cb-icon-btn" onClick={() => fileRef.current?.click()} title="Upload document" style={{minWidth:44, fontSize:11, flexDirection:"column", gap:2}}>
                📎
                <span style={{fontSize:9, color:"var(--text-muted)"}}>Attach</span>
              </button>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} disabled={loading} placeholder="Ask anything... (Enter to send)" rows={1} />
              <button className={`cb-send-btn ${input.trim() && !loading ? "active" : ""}`} onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])} />
          </div>
        </>)}

        {/* ATS Resume Tab */}
        {tab === "resume" && (
          <div className="cb-ats-panel">
            {/* Header */}
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px"}}>ATS Resume Analyzer</h2>
              <p style={{fontSize:13,color:"var(--text-muted)",margin:0}}>
                Upload your resume and the job description to get a precise ATS compatibility score.
              </p>
            </div>

            {/* Two-column upload area */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

              {/* Resume upload */}
              <div style={{
                border:`2px dashed ${resume ? "#6366f1" : "var(--border-primary)"}`,
                borderRadius:12, padding:24, background: resume ? "rgba(99,102,241,0.04)" : "var(--bg-tertiary)",
                cursor:"pointer", transition:"all 0.15s", position:"relative",
              }}
                onClick={() => !resume && fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
              >
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-muted)",marginBottom:12}}>
                  Resume / CV <span style={{color:"var(--accent-rose)"}}>*</span>
                </div>
                {resume ? (
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{
                      width:40,height:40,borderRadius:8,background:"rgba(99,102,241,0.1)",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{resume.name}</div>
                      <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{Math.round(resume.text.length/5)} words extracted</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setResume(null); setAtsData(null); }}
                      style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent-rose)",padding:4,flexShrink:0}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ) : (
                  <div style={{textAlign:"center",padding:"8px 0"}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{margin:"0 auto 10px",display:"block"}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Upload Resume</div>
                    <div style={{fontSize:11,color:"var(--text-muted)"}}>PDF, DOC, TXT - drag or click</div>
                  </div>
                )}
              </div>

              {/* JD upload / paste */}
              <div style={{
                border:`2px dashed ${jobDesc ? "#10b981" : "var(--border-primary)"}`,
                borderRadius:12, padding:24, background: jobDesc ? "rgba(16,185,129,0.04)" : "var(--bg-tertiary)",
                transition:"all 0.15s", display:"flex", flexDirection:"column",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-muted)"}}>
                    Job Description <span style={{color:"var(--accent-rose)"}}>*</span>
                  </div>
                  <button
                    onClick={() => jdFileRef.current?.click()}
                    style={{
                      fontSize:11,fontWeight:600,color:"var(--accent-primary)",background:"rgba(99,102,241,0.08)",
                      border:"1px solid rgba(99,102,241,0.2)",borderRadius:6,padding:"3px 10px",cursor:"pointer",
                    }}
                  >
                    Upload JD
                  </button>
                </div>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste the job description here...&#10;&#10;Include the role requirements, responsibilities, and required skills for the most accurate ATS score."
                  style={{
                    flex:1, minHeight:100, border:"none", outline:"none", background:"transparent",
                    color:"var(--text-primary)", fontSize:12, lineHeight:1.6, resize:"none",
                    fontFamily:"inherit",
                  }}
                />
                {jobDesc && (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid var(--border-primary)"}}>
                    <span style={{fontSize:11,color:"var(--accent-emerald)",fontWeight:600}}>✓ JD loaded ({jobDesc.length} chars)</span>
                    <button onClick={() => setJobDesc("")} style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer"}}>Clear</button>
                  </div>
                )}
              </div>
            </div>

            {/* Info banner when JD is missing */}
            {resume && !jobDesc && (
              <div style={{
                padding:"10px 14px",borderRadius:8,marginBottom:16,
                background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",
                display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#b45309",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Add a job description for a targeted ATS score. Without it, analysis will be generic.
              </div>
            )}

            {/* Analyze button */}
            {resume && (
              <button
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={atsLoading}
                style={{marginBottom:28, minWidth:180}}
              >
                {atsLoading ? "Analyzing..." : jobDesc ? "Analyze Against JD" : "Analyze Resume"}
              </button>
            )}

            {/* Results */}
            {atsData && (
              <div style={{animation:"cb-fadeUp 0.4s ease"}}>
                <div className="cb-scores-grid">
                  <ScoreRing score={atsData.overall_score} size={96} color={scoreColor(atsData.overall_score)} label="Overall /100" />
                  <ScoreRing score={atsData.keyword_score} size={72} color="var(--accent-cyan)" label="Keywords /30" />
                  <ScoreRing score={atsData.format_score} size={72} color="var(--accent-secondary)" label="Format /20" />
                  <ScoreRing score={atsData.content_score} size={72} color="var(--accent-emerald)" label="Content /25" />
                  <ScoreRing score={atsData.impact_score} size={72} color="var(--accent-amber)" label="Impact /15" />
                  {atsData.experience_match != null && <ScoreRing score={atsData.experience_match} size={72} color="var(--accent-rose)" label="Exp Match /10" />}
                </div>
                {atsData.summary && (
                  <div className="cb-result-card" style={{marginBottom:16}}>
                    <h4 style={{color:"var(--accent-primary-light)"}}>EXECUTIVE SUMMARY</h4>
                    <p style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.7}}>{atsData.summary}</p>
                    {atsData.experience_years != null && <span className="cb-tag" style={{background:"rgba(99,102,241,0.1)",borderColor:"rgba(99,102,241,0.2)",color:"var(--accent-primary-light)",marginTop:10}}>~{atsData.experience_years} years experience</span>}
                  </div>
                )}
                <div className="cb-results-grid">
                  <div className="cb-result-card"><h4 style={{color:"var(--accent-emerald)"}}>STRENGTHS</h4>{(atsData.strengths||[]).map((s,i) => <p key={i} style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:6}}>• {s}</p>)}</div>
                  <div className="cb-result-card"><h4 style={{color:"var(--accent-rose)"}}>IMPROVEMENTS</h4>{(atsData.improvements||[]).map((s,i) => <p key={i} style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:6}}>• {s}</p>)}</div>
                </div>
                <div className="cb-results-grid">
                  <div className="cb-result-card"><h4 style={{color:"var(--accent-secondary)"}}>TOP SKILLS</h4><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(atsData.top_skills||[]).map((s,i) => <span key={i} className="cb-tag" style={{background:"rgba(139,92,246,0.1)",borderColor:"rgba(139,92,246,0.2)",color:"var(--accent-secondary)"}}>{s}</span>)}</div></div>
                  <div className="cb-result-card"><h4 style={{color:"var(--accent-amber)"}}>MISSING KEYWORDS</h4><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(atsData.missing_keywords||[]).map((s,i) => <span key={i} className="cb-tag" style={{background:"rgba(245,158,11,0.1)",borderColor:"rgba(245,158,11,0.2)",color:"var(--accent-amber)"}}>{s}</span>)}</div></div>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])} />
            <input ref={jdFileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{display:"none"}} onChange={e => handleJDFile(e.target.files[0])} />
          </div>
        )}

        {/* Courses Tab */}
        {tab === "courses" && (
          <div className="cb-courses-panel">
            <h2 style={{fontSize:22,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>Course Finder</h2>
            <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:24}}>Search Udemy & Coursera for any skill or topic.</p>
            <div className="cb-course-search">
              <input value={courseQuery} onChange={e => setCourseQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && handleFindCourses()} placeholder="e.g. Machine Learning, React, Data Science..." />
              <button className="btn btn-primary" onClick={handleFindCourses} disabled={!courseQuery.trim() || courseLoading}>{courseLoading ? "⏳ Searching" : "🔍 Search"}</button>
            </div>
            {courses.length === 0 && !courseLoading && (
              <div style={{textAlign:"center",paddingTop:40}}>
                <div style={{fontSize:40,marginBottom:12}}>🎓</div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)"}}>Search for a topic to find courses</div>
                <div className="cb-quick-prompts" style={{marginTop:20}}>
                  {["Python","Machine Learning","UI/UX Design","React","Cloud AWS"].map(t => <button key={t} className="cb-quick-prompt" onClick={() => setCourseQuery(t)}>{t}</button>)}
                </div>
              </div>
            )}
            {courses.length > 0 && (<>
              <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
                <span style={{fontSize:11,color:"var(--text-muted)"}}>{courses.length} found</span>
                <span className="badge badge-interviewed">Udemy: {courses.filter(c => c.platform==="Udemy").length}</span>
                <span className="badge badge-reviewing">Coursera: {courses.filter(c => c.platform==="Coursera").length}</span>
              </div>
              <div className="cb-courses-grid">
                {courses.map((c,i) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="cb-course-card">
                    <span className={`badge ${c.platform==="Udemy" ? "badge-interviewed" : "badge-reviewing"}`} style={{marginBottom:8,display:"inline-block"}}>{c.platform}</span>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",lineHeight:1.4,marginBottom:6}}>{c.title}</div>
                    {c.content && <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.5}}>{c.content.slice(0,120)}...</div>}
                    <div style={{marginTop:8,fontSize:11,color:"var(--accent-primary-light)",display:"flex",alignItems:"center",gap:4}}>View Course →</div>
                  </a>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* Web Search Tab */}
        {tab === "search" && <WebSearchTab />}
      </div>
    </div>
  );
}
