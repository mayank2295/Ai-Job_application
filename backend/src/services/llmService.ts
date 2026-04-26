// Intelligent LLM router: local Ollama first -> OpenRouter fallback
// Set OLLAMA_ENABLED=true in .env to use local models

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  text: string;
  model: string;
  provider: 'ollama' | 'openrouter';
  tokens_used?: number;
}

const LOCAL_CAPABLE_TASKS = ['ats_score', 'cover_letter', 'quiz_generate', 'interview_feedback'];

export async function callLLM(
  messages: LLMMessage[],
  options: {
    task?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
    forceCloud?: boolean;
  } = {}
): Promise<LLMResponse> {
  const { task, maxTokens = 1000, temperature = 0.7, jsonMode = false, forceCloud = false } = options;

  const useLocal =
    !forceCloud &&
    process.env.OLLAMA_ENABLED === 'true' &&
    (task ? LOCAL_CAPABLE_TASKS.includes(task) : true);

  if (useLocal) {
    try {
      return await callOllama(messages, { maxTokens, temperature, jsonMode });
    } catch (err) {
      console.warn('[LLM] Ollama failed, falling back to OpenRouter:', (err as Error).message);
    }
  }

  return await callOpenRouter(messages, { maxTokens, temperature, jsonMode });
}

async function callOllama(
  messages: LLMMessage[],
  options: { maxTokens: number; temperature: number; jsonMode: boolean }
): Promise<LLMResponse> {
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: options.temperature, num_predict: options.maxTokens },
      format: options.jsonMode ? 'json' : undefined,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json() as { message?: { content: string }; eval_count?: number };
  return {
    text: data.message?.content || '',
    model,
    provider: 'ollama',
    tokens_used: data.eval_count,
  };
}

async function callOpenRouter(
  messages: LLMMessage[],
  options: { maxTokens: number; temperature: number; jsonMode: boolean }
): Promise<LLMResponse> {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://jobflow.ai',
      'X-Title': 'JobFlow AI',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json() as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens: number };
  };
  return {
    text: data.choices[0]?.message?.content || '',
    model,
    provider: 'openrouter',
    tokens_used: data.usage?.total_tokens,
  };
}

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
