// Embedding service — local Ollama (nomic-embed-text) with OpenRouter fallback
// Used by semantic search routes

export async function getEmbedding(text: string): Promise<number[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const response = await fetch(`${baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
      prompt: text.slice(0, 8000),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Ollama embedding error: ${response.status}`);
  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

export async function getEmbeddingCloud(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text }),
  });
  if (!response.ok) throw new Error(`OpenRouter embedding error: ${response.status}`);
  const data = await response.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

export async function safeGetEmbedding(text: string): Promise<number[] | null> {
  try {
    if (process.env.OLLAMA_ENABLED === 'true') {
      return await getEmbedding(text);
    }
    return await getEmbeddingCloud(text);
  } catch (err) {
    console.warn('[Embedding] Failed, semantic search unavailable:', (err as Error).message);
    return null;
  }
}
