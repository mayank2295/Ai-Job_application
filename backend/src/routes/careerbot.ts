import { Router, Request, Response } from 'express';

const router = Router();

// Retrieve keys securely from backend environment
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY;
const getTavilyKey = () => process.env.TAVILY_API_KEY;
const getModel = () => process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// ─── Tavily Search ───
export async function tavilySearch(query: string, depth = "basic") {
  const apiKey = getTavilyKey();
  if (!apiKey) throw new Error("TAVILY_API_KEY is not configured in backend.");
  
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: depth, max_results: 6, include_answer: true }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}`);
  return r.json();
}

// ─── Find Courses ───
export async function findCoursesOnline(topic: string) {
  const [udemy, coursera] = await Promise.all([
    tavilySearch(`udemy course ${topic} best rated 2024`, "advanced"),
    tavilySearch(`coursera course ${topic} certificate 2024`, "advanced"),
  ]);
  return [
    ...(udemy.results || []).slice(0, 4).map((r: any) => ({ ...r, platform: "Udemy" })),
    ...(coursera.results || []).slice(0, 4).map((r: any) => ({ ...r, platform: "Coursera" })),
  ];
}

// ─── OpenRouter LLM ───
export async function callLLM(messages: any[], tools: any = null) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured in backend.");

  const body = { model: getModel(), messages, max_tokens: 1500, ...(tools ? { tools, tool_choice: "auto" } : {}) };
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
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

// ─── Endpoints ───

// POST /api/careerbot/chat
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages array." });
      return;
    }

    const msgs = [...messages];
    let coursesResult: any[] | null = null;
    let events: any[] = []; // Track tool events for the frontend

    // Agent loop (up to 6 iterations)
    for (let round = 0; round < 6; round++) {
      const data = await callLLM(msgs, TOOLS);
      const msg = data.choices[0].message;
      if (!msg.tool_calls?.length) {
        // Return final answer
        res.json({ 
          reply: msg.content || "", 
          courses: coursesResult,
          events
        });
        return;
      }

      msgs.push(msg);

      for (const tc of msg.tool_calls) {
        let result = "";
        const args = JSON.parse(tc.function.arguments || "{}");
        if (tc.function.name === "web_search") {
          events.push({ type: 'status', message: `🔍 Searching: "${args.query}"…` });
          try {
            const d = await tavilySearch(args.query);
            result = JSON.stringify({ answer: d.answer, results: (d.results || []).slice(0, 4).map((x: any) => ({ title: x.title, snippet: (x.content || "").slice(0, 300), url: x.url })) });
          } catch (e: any) { result = JSON.stringify({ error: e.message }); }
        } else if (tc.function.name === "find_courses") {
          events.push({ type: 'status', message: `📚 Finding courses: "${args.topic}"…` });
          try {
            const courses = await findCoursesOnline(args.topic);
            coursesResult = courses;
            result = JSON.stringify(courses.slice(0, 5).map((c: any) => ({ title: c.title, url: c.url, platform: c.platform })));
          } catch (e: any) { result = JSON.stringify({ error: e.message }); }
        }
        msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    }

    // Final fallback call if iterations max out
    const final = await callLLM(msgs, null);
    res.json({ reply: final.choices[0].message.content || "", courses: coursesResult, events });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/analyze-ats
router.post('/analyze-ats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, jobDesc } = req.body;
    if (!resumeText) {
      res.status(400).json({ error: "resumeText is required." });
      return;
    }

    const prompt = `You are an expert ATS resume analyst.\n${jobDesc ? `Target Job Description:\n${jobDesc.slice(0, 800)}\n\n` : ""}Resume Content:\n${resumeText.slice(0, 3500)}\n\nReturn ONLY raw JSON: {"overall_score":<0-100>,"keyword_score":<0-100>,"format_score":<0-100>,"content_score":<0-100>,"impact_score":<0-100>,"experience_years":<int|null>,"top_skills":[<up to 8>],"missing_keywords":[<up to 6>],"strengths":[<3>],"improvements":[<4>],"summary":"<2-3 sentences>"}`;
    const data = await callLLM([
      { role: "system", content: "You are an ATS expert. Respond ONLY with valid JSON." },
      { role: "user", content: prompt },
    ]);
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch (error: any) {
    console.error("ATS Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/careerbot/courses
router.post('/courses', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: "topic is required." });
      return;
    }
    const courses = await findCoursesOnline(topic);
    res.json({ courses });
  } catch (error: any) {
    console.error("Course Finder Error:", error);
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
    console.error("Simple Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
