import { Router, Request, Response } from 'express';
import { callLLMSmart } from '../services/llmService';

const router = Router();

const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer general questions politely. Keep your answers concise and simple.`;

/**
 * POST /api/ai/chat
 * General-purpose chat using the shared LLM router (Groq -> OpenRouter fallback).
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
        const text = String(m.parts?.[0]?.text ?? m.text ?? m.content ?? '').trim();
        return { role: role as 'user' | 'assistant', content: text };
      })
      .filter((m) => m.content.length > 0);

    if (normalized.length === 0) {
      res.status(400).json({ error: 'messages must include at least one non-empty message' });
      return;
    }

    const maxHistory = Number(process.env.AI_MAX_HISTORY) || 20;
    const recentMessages = normalized.slice(-maxHistory);

    const data = await callLLMSmart([
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages,
    ]);

    const text = data.choices?.[0]?.message?.content ?? 'Sorry, I could not process that. Please try again.';
    res.json({ text });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
