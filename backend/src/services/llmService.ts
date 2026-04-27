/**
 * Smart LLM Router
 * Priority: OpenRouter (primary) -> Groq (fallback)
 *
 * Set in .env:
 *   OPENROUTER_API_KEY=sk-or-...  (primary)
 *   OPENROUTER_MODEL=openai/gpt-4o-mini  (optional, this is the default)
 *   GROQ_API_KEY=gsk_...          (fallback if OpenRouter fails)
 *   GROQ_MODEL=llama-3.3-70b-versatile   (optional, this is the default)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
}

export interface LLMResponse {
  choices: { message: { content: string; tool_calls?: any[] } }[];
  usage?: { total_tokens: number };
  _provider?: 'groq' | 'openrouter';
}

// ─── Groq ────────────────────────────────────────────────────────────────────

async function callGroq(
  messages: LLMMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    tools?: any[];
    jsonMode?: boolean;
  } = {}
): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

  const body: any = {
    model,
    messages,
    max_tokens: options.maxTokens || 1500,
    temperature: options.temperature ?? 0.7,
  };

  if (options.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = 'auto';
  }

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json() as LLMResponse;
  data._provider = 'groq';
  return data;
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

async function callOpenRouter(
  messages: LLMMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    tools?: any[];
    jsonMode?: boolean;
  } = {}
): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const body: any = {
    model,
    messages,
    max_tokens: options.maxTokens || 1500,
    temperature: options.temperature ?? 0.7,
  };

  if (options.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = 'auto';
  }

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://jobflow.ai',
      'X-Title': 'JobFlow AI',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json() as LLMResponse;
  data._provider = 'openrouter';
  return data;
}

// ─── Smart Router ─────────────────────────────────────────────────────────────

/**
 * Main entry point. Tries OpenRouter first (primary), falls back to Groq.
 * Pass forceProvider to skip routing logic.
 */
export async function callLLMSmart(
  messages: LLMMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    tools?: any[];
    jsonMode?: boolean;
    forceProvider?: 'groq' | 'openrouter';
  } = {}
): Promise<LLMResponse> {
  const { forceProvider, ...rest } = options;

  // Force a specific provider
  if (forceProvider === 'openrouter') return callOpenRouter(messages, rest);
  if (forceProvider === 'groq') return callGroq(messages, rest);

  // Try OpenRouter first (primary)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const result = await callOpenRouter(messages, rest);
      console.log(`[LLM] OpenRouter (${process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'})`);
      return result;
    } catch (err: any) {
      console.warn(`[LLM] OpenRouter failed (${err.message}), falling back to Groq`);
    }
  }

  // Fallback to Groq
  console.log(`[LLM] Groq fallback (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`);
  return callGroq(messages, rest);
}

// ─── Streaming (OpenRouter only — Groq streaming needs SSE parsing) ───────────

export async function streamLLM(
  messages: LLMMessage[],
  onChunk: (text: string) => void,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<void> {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.8,
    }),
  });

  if (!response.ok || !response.body) throw new Error('Stream failed');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));
    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const text = parsed.choices?.[0]?.delta?.content || '';
        if (text) onChunk(text);
      } catch {}
    }
  }
}
