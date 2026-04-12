import { Router, Request, Response } from 'express';

const router = Router();

const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer general questions politely. Keep your answers concise and simple.`;

/**
 * POST /api/ai/chat
 * Proxy to Anthropic API directly using the supplied Claude key.
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const normalized = messages
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any) => {
        const role = m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user';
        const text = String(m.parts?.[0]?.text ?? m.text ?? '').trim();
        return { role, content: text };
      })
      .filter((m: any) => m.content.length > 0);

    if (normalized.length === 0) {
      res.status(400).json({ error: 'messages must include at least one non-empty message' });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Anthropic API key not configured' });
      return;
    }

    const maxHistoryRaw = Number(process.env.AI_MAX_HISTORY || 20);
    const maxHistory = Number.isFinite(maxHistoryRaw) && maxHistoryRaw > 0 ? maxHistoryRaw : 20;
    const recentMessages = normalized.slice(-maxHistory);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: recentMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      res.status(500).json({ error: 'Anthropic API request failed', details: errText });
      return;
    }

    const data: any = await response.json();
    const text = data.content?.[0]?.text ?? 'Sorry, I could not process that. Please try again.';

    res.json({ text });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/health - Health check
router.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
