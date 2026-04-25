import { Router, Request, Response } from 'express';
import { all, get, run } from '../database/db';

const router = Router();

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY;
const getTavilyKey = () => process.env.TAVILY_API_KEY;
const getModel = () => process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function tavilySearch(query: string, depth = "basic"): Promise<any> {
  const apiKey = getTavilyKey();
  if (!apiKey) throw new Error("TAVILY_API_KEY is not configured.");
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: depth, max_results: 8, include_answer: true }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}: ${await r.text()}`);
  return r.json();
}

export async function callLLM(messages: any[], tools: any = null): Promise<any> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");
  const body: any = { model: getModel(), messages, max_tokens: 1500 };
  if (tools) { body.tools = tools; body.tool_choice = "auto"; }
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "https://jobflow.ai", "X-Title": "JobFlow AI" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
  return r.json();
}

const TOOLS = [
  { type: "function", function: { name: "web_search", description: "Search the web for real-time information, news, people, companies, jobs.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "find_courses", description: "Find online courses on Udemy or Coursera for a skill or topic.", parameters: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] } } },
  { type: "function", function: { name: "scrape_profiles", description: "Find and rank professionals/experts by criteria (e.g. top 10 LinkedIn React developers in Bangalore).", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
];

// POST /api/careerbot/chat
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) { res.status(400).json({ error: "messages array required" }); return; }

    const msgs = [...messages];
    let coursesResult: any[] | null = null;
    let profilesResult: any[] | null = null;
    const events: any[] = [];

    for (let round = 0; round < 8; round++) {
      const data = await callLLM(msgs, TOOLS);
      const msg = data.choices[0].message;
      if (!msg.tool_calls?.length) {
        res.json({ reply: msg.content || "", courses: coursesResult, profiles: profilesResult, events });
        return;
      }
      msgs.push(msg);

      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        let result = "";

        if (tc.function.name === "web_search") {
          events.push({ type: "status", message: `🔍 Searching: "${args.query}"…` });
          try {
            const d = await tavilySearch(args.query, "advanced");
            result = JSON.stringify({ answer: d.answer, results: (d.results || []).slice(0, 5).map((x: any) => ({ title: x.title, snippet: (x.content || "").slice(0, 400), url: x.url })) });
          } catch (e: any) { result = JSON.stringify({ error: e.message }); }

        } else if (tc.function.name === "find_courses") {
          events.push({ type: "status", message: `📚 Finding courses: "${args.topic}"…` });
          try {
            const [u, c] = await Promise.all([
              tavilySearch(`site:udemy.com ${args.topic} course`, "advanced"),
              tavilySearch(`site:coursera.org ${args.topic} course`, "advanced"),
            ]);
            const courses = [
              ...(u.results || []).slice(0, 4).map((r: any) => ({ ...r, platform: "Udemy" })),
              ...(c.results || []).slice(0, 4).map((r: any) => ({ ...r, platform: "Coursera" })),
            ];
            coursesResult = courses;
            result = JSON.stringify(courses.slice(0, 6).map((c: any) => ({ title: c.title, url: c.url, platform: c.platform })));
          } catch (e: any) { result = JSON.stringify({ error: e.message }); }

        } else if (tc.function.name === "scrape_profiles") {
          events.push({ type: "status", message: `👥 Scraping profiles: "${args.query}"…` });
          try {
            const d = await tavilySearch(args.query + " LinkedIn profile", "advanced");
            const profiles = (d.results || []).slice(0, 10).map((r: any) => ({
              name: r.title?.replace(/ - LinkedIn/i, "").trim(),
              snippet: (r.content || "").slice(0, 300),
              url: r.url,
              source: "LinkedIn",
            }));
            profilesResult = profiles;
            result = JSON.stringify(profiles.map((p: any) => ({ name: p.name, snippet: p.snippet.slice(0, 150), url: p.url })));
          } catch (e: any) { result = JSON.stringify({ error: e.message }); }
        }

        msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    }

    const final = await callLLM(msgs, null);
    res.json({ reply: final.choices[0].message.content || "", courses: coursesResult, profiles: profilesResult, events });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/analyze-ats
router.post('/analyze-ats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, jobDesc } = req.body;
    if (!resumeText) { res.status(400).json({ error: "resumeText is required." }); return; }
    const prompt = `You are an expert ATS analyst.\n${jobDesc ? `Job Description:\n${String(jobDesc).slice(0, 800)}\n\n` : ""}Resume:\n${String(resumeText).slice(0, 3500)}\n\nReturn ONLY raw JSON (no markdown): {"overall_score":<0-100>,"keyword_score":<0-100>,"format_score":<0-100>,"content_score":<0-100>,"impact_score":<0-100>,"experience_years":<int|null>,"top_skills":["..."],"missing_keywords":["..."],"strengths":["..."],"improvements":["..."],"summary":"..."}`;
    const data = await callLLM([
      { role: "system", content: "You are an ATS expert. Respond ONLY with valid raw JSON, no markdown, no backticks." },
      { role: "user", content: prompt },
    ]);
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/courses
router.post('/courses', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;
    if (!topic) { res.status(400).json({ error: "topic required" }); return; }
    const [u, c] = await Promise.all([
      tavilySearch(`site:udemy.com ${topic} course`, "advanced"),
      tavilySearch(`site:coursera.org ${topic} course`, "advanced"),
    ]);
    const courses = [
      ...(u.results || []).slice(0, 5).map((r: any) => ({ ...r, platform: "Udemy" })),
      ...(c.results || []).slice(0, 5).map((r: any) => ({ ...r, platform: "Coursera" })),
    ];
    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/search — general web search
router.post('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, depth } = req.body;
    if (!query) { res.status(400).json({ error: "query required" }); return; }
    const data = await tavilySearch(query, depth || "advanced");
    res.json({ answer: data.answer, results: (data.results || []).slice(0, 8) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/profiles — scrape people/professionals
router.post('/profiles', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) { res.status(400).json({ error: "query required" }); return; }
    const data = await tavilySearch(query + " LinkedIn profile site:linkedin.com", "advanced");
    const profiles = (data.results || []).slice(0, 10).map((r: any) => ({
      name: r.title?.replace(/ [-|] LinkedIn.*/i, "").trim(),
      snippet: (r.content || "").slice(0, 400),
      url: r.url,
      source: "LinkedIn",
    }));
    res.json({ profiles, answer: data.answer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/simple-chat
router.post('/simple-chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { history } = req.body;
    const data = await callLLM(history);
    res.json({ reply: data.choices[0].message.content || "" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/careerbot/sessions
router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, bot_type } = req.query;
    if (!user_id || !bot_type) {
      res.status(400).json({ error: 'user_id and bot_type are required' });
      return;
    }
    
    const rows: unknown[] = await all(
      'SELECT * FROM chat_sessions WHERE user_id = $1 AND bot_type = $2 ORDER BY updated_at DESC',
      [user_id as string, bot_type as string]
    );
    
    // Explicitly parse messages from JSON storage back into arrays
    const formattedRows = rows.map((r: any) => ({
      ...r,
      messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : (r.messages || [])
    }));
    
    res.json(formattedRows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/sessions
router.post('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, user_id, bot_type, title, messages } = req.body;
    
    if (!id || !user_id || !bot_type) {
      res.status(400).json({ error: 'id, user_id, and bot_type are required.' });
      return;
    }
    
    const ts = new Date().toISOString();
    // Serialize messages to JSON string (PostgreSQL JSON/TEXT column)
    const msgsParam = typeof messages === 'string' ? messages : JSON.stringify(messages || []);

    await run(`
      INSERT INTO chat_sessions (id, user_id, bot_type, title, messages, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        updated_at = EXCLUDED.updated_at
    `, [id, user_id, bot_type, title || 'New Chat', msgsParam, ts, ts]);

    const session = await get('SELECT * FROM chat_sessions WHERE id = $1', [id]);
    if (session) {
      (session as any).messages = typeof (session as any).messages === 'string' ? JSON.parse((session as any).messages) : ((session as any).messages || []);
    }
    res.json(session);
  } catch (error: any) {
    console.error("Session sync error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/careerbot/sessions/:id
router.delete('/sessions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await run('DELETE FROM chat_sessions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
