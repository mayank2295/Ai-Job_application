"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const SYSTEM_PROMPT = `You are a helpful AI assistant for this company's careers portal. Provide clear, accurate answers to general questions.
If the user wants to apply for a job, guide them through the application details conversationally and politely.

You need to collect these fields when they want to apply:
1. full_name (REQUIRED) - their full legal name
2. email (REQUIRED) - their email address
3. phone (optional) - their phone number
4. position (REQUIRED) - the job position they are applying for
5. experience_years (REQUIRED) - number of years of relevant experience (must be a number)
6. cover_letter (optional) - a brief note about why they want this role

RULES:
- Be warm, professional, and conversational. Keep your answers short.
- If the user asks general questions or needs help, answer them directly and helpfully without restricting them to the application process.
- If the user says "apply", "apply for a job", "I want to apply", or similar → start the collection process by greeting them and asking for their name.
- As the user provides info, confirm it and ask for the next missing field naturally.
- If the user provides multiple fields at once, extract all of them and only ask for what is still missing.
- Once you have ALL required fields (full_name, email, position, experience_years), do NOT ask any more questions. Instead, respond with ONLY this exact JSON and nothing else:
{"action":"submit","data":{"full_name":"...","email":"...","phone":"...","position":"...","experience_years":0,"cover_letter":"..."}}
- Replace the "..." values with the actual collected data. experience_years must be an integer.
- If phone or cover_letter were not provided, use empty string "".
- Do NOT include any text before or after the JSON when triggering a submit.
- If the user wants to cancel, acknowledge it politely.`;
/**
 * POST /api/ai/chat
 * Proxy to Anthropic API with job application system prompt.
 * Body: { messages: Array<{role: "user"|"model", parts: [{text: string}]}> }
 */
router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: 'messages array is required' });
            return;
        }
        const normalized = messages
            .filter((m) => m && typeof m === 'object')
            .map((m) => {
            const role = m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user';
            const text = String(m.parts?.[0]?.text ?? m.text ?? '').trim();
            return { role, text };
        })
            .filter((m) => m.text.length > 0);
        if (normalized.length === 0) {
            res.status(400).json({ error: 'messages must include at least one non-empty message' });
            return;
        }
        const maxHistoryRaw = Number(process.env.AI_MAX_HISTORY || 20);
        const maxHistory = Number.isFinite(maxHistoryRaw) && maxHistoryRaw > 0 ? maxHistoryRaw : 20;
        const recentMessages = normalized.slice(-maxHistory);
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Anthropic API key not configured' });
            return;
        }
        const anthropicMessages = recentMessages.map((m) => ({
            role: m.role,
            content: m.text,
        }));
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
                messages: anthropicMessages,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Anthropic API error:', errText);
            res.status(500).json({ error: 'Anthropic API request failed', details: errText });
            return;
        }
        const data = await response.json();
        const text = data.content?.[0]?.text ?? 'Sorry, I could not process that. Please try again.';
        res.json({ text });
    }
    catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map