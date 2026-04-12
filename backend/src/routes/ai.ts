import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

const SYSTEM_PROMPT = `You are a friendly, polite assistant for a job-application portal.
Explain clearly and practically. Prefer short steps/bullets. Keep it brief.`;

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function truncateText(input: string, maxChars: number) {
  const s = String(input ?? '');
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + '…';
}

type NormalizedMessage = {
  role: 'user' | 'model';
  text: string;
};

async function generateWithGemini(opts: {
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  userMessage: string;
  maxOutputTokens: number;
}) {
  const genAI = new GoogleGenerativeAI(opts.apiKey);
  const model = genAI.getGenerativeModel({
    model: opts.modelName,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      maxOutputTokens: opts.maxOutputTokens,
      temperature: 0.6,
    },
  });

  const chat = model.startChat({ history: opts.history });
  const result = await chat.sendMessage(opts.userMessage);
  return result.response.text();
}

async function generateWithXai(opts: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  systemPrompt: string;
  messages: NormalizedMessage[];
  maxOutputTokens: number;
}) {
  const base = opts.baseUrl.replace(/\/$/, '');

  const commonHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${opts.apiKey}`,
  };

  const chatCompletionsUrl = `${base}/chat/completions`;
  const chatPayload = {
    model: opts.modelName,
    temperature: 0.6,
    max_tokens: opts.maxOutputTokens,
    stream: false,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      ...opts.messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text,
      })),
    ],
  };

  // Try OpenAI-compatible chat completions first.
  const chatResp = await fetch(chatCompletionsUrl, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(chatPayload),
  });

  if (chatResp.ok) {
    const data: any = await chatResp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim().length > 0) return content;
    throw new Error('xAI chat/completions returned an empty response');
  }

  // If chat/completions isn't available, fall back to the newer /responses API.
  // We keep it simple by flattening history into a single prompt.
  const chatErrorText = await chatResp.text().catch(() => '');
  const responsesUrl = `${base}/responses`;

  const prompt = [
    `System: ${opts.systemPrompt}`,
    ...opts.messages.map((m) => `${m.role === 'model' ? 'Assistant' : 'User'}: ${m.text}`),
    'Assistant:',
  ].join('\n');

  const responsesPayload = {
    model: opts.modelName,
    input: prompt,
  };

  const resp = await fetch(responsesUrl, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(responsesPayload),
  });

  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => '');
    const hint = bodyText ? ` - ${bodyText.slice(0, 500)}` : '';
    const chatHint = chatErrorText ? ` | chat/completions: ${chatResp.status} - ${chatErrorText.slice(0, 200)}` : ` | chat/completions: ${chatResp.status}`;
    throw new Error(`xAI request failed (${resp.status})${hint}${chatHint}`);
  }

  const data: any = await resp.json();
  const outputText =
    (typeof data?.output_text === 'string' && data.output_text) ||
    (typeof data?.response === 'string' && data.response) ||
    undefined;
  if (outputText && outputText.trim().length > 0) return outputText;

  // Best-effort deep extraction for responses-style payloads.
  const maybeText = data?.output?.[0]?.content?.[0]?.text;
  if (typeof maybeText === 'string' && maybeText.trim().length > 0) return maybeText;

  throw new Error('xAI responses API returned an empty response');
}

/**
 * POST /api/ai/chat
 * Proxy to Gemini API using a server-side API key.
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const maxCharsPerMessage = clampInt(process.env.AI_MAX_CHARS_PER_MESSAGE, 2000, 200, 20000);

    const normalized: NormalizedMessage[] = messages
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any): NormalizedMessage => {
        const role: NormalizedMessage['role'] = m.role === 'model' || m.role === 'assistant' ? 'model' : 'user';
        const text = truncateText(String(m.parts?.[0]?.text ?? m.text ?? '').trim(), maxCharsPerMessage);
        return { role, text };
      })
      .filter((m: NormalizedMessage) => m.text.length > 0);

    if (normalized.length === 0) {
      res.status(400).json({ error: 'messages must include at least one non-empty message' });
      return;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const xaiApiKey = process.env.XAI_API_KEY;
    if (!geminiApiKey && !xaiApiKey) {
      res.status(500).json({ error: 'No AI provider configured (set GEMINI_API_KEY and/or XAI_API_KEY)' });
      return;
    }

    // Smaller history = faster requests.
    const maxHistory = clampInt(process.env.AI_MAX_HISTORY, 10, 1, 50);
    const recentMessages = normalized.slice(-maxHistory);

    const lastMessage = recentMessages[recentMessages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      res.status(400).json({ error: 'Last message must be a user message' });
      return;
    }

    const history = recentMessages.slice(0, -1).map((m: any) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    let text = '';
    let provider: 'gemini' | 'xai' = geminiApiKey ? 'gemini' : 'xai';

    const primary = (process.env.AI_PRIMARY_PROVIDER || '').toLowerCase();
    const order: Array<'xai' | 'gemini'> = primary === 'xai' ? ['xai', 'gemini'] : ['gemini', 'xai'];

    for (const p of order) {
      if (text) break;

      if (p === 'gemini') {
        if (!geminiApiKey) continue;
        try {
          const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
          const maxOutputTokens = clampInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 512, 64, 2048);
          text = await generateWithGemini({
            apiKey: geminiApiKey,
            modelName,
            systemPrompt: SYSTEM_PROMPT,
            history,
            userMessage: lastMessage.text,
            maxOutputTokens,
          });
          provider = 'gemini';
        } catch (err) {
          console.error('Gemini failed:', err);
        }
        continue;
      }

      if (p === 'xai') {
        if (!xaiApiKey) continue;
        try {
          const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
          const modelName = process.env.XAI_MODEL || 'grok-2-latest';
          const maxOutputTokens = clampInt(process.env.XAI_MAX_OUTPUT_TOKENS, 512, 64, 2048);
          text = await generateWithXai({
            apiKey: xaiApiKey,
            baseUrl,
            modelName,
            systemPrompt: SYSTEM_PROMPT,
            messages: recentMessages,
            maxOutputTokens,
          });
          provider = 'xai';
        } catch (err) {
          console.error('xAI failed:', err);
        }
      }
    }

    const safeText = text || 'Sorry, I could not process that. Please try again.';
    res.json({ text: safeText, provider });
  } catch (error: any) {
    console.error('AI chat error:', error);
    const details = typeof error?.message === 'string' ? error.message : undefined;
    const includeDetails = process.env.NODE_ENV !== 'production';

    res.status(500).json({
      error: 'AI request failed',
      ...(includeDetails && details ? { details } : {}),
    });
  }
});

// GET /api/ai/health - Health check
router.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
