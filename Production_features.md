# JobFlow AI — Complete Enhancement Implementation Guide
> Hand this file to AI agents. Every section is self-contained with exact file paths, complete code, and SQL migrations.

---

## TABLE OF CONTENTS
1. [Rate Limiting](#1-rate-limiting)
2. [Multi-Tenancy — company_id migration](#2-multi-tenancy)
3. [Stripe Billing Integration](#3-stripe-billing)
4. [Self-Hosted LLM with Ollama](#4-self-hosted-llm)
5. [WebSocket Real-Time Updates](#5-websockets)
6. [GDPR — Right to Erasure](#6-gdpr)
7. [Detailed Health Endpoint](#7-health-endpoint)
8. [pgvector Semantic Search](#8-pgvector-semantic-search)
9. [Candidate Reputation Score](#9-reputation-score)
10. [Email Queue with Bull + Redis](#10-email-queue)
11. [Audit Logging](#11-audit-logging)
12. [Frontend — Stripe Billing UI](#12-frontend-billing-ui)
13. [Docker Compose for Local Self-Hosted Stack](#13-docker-compose)
14. [Environment Variables — Complete Reference](#14-environment-variables)

---

## 1. RATE LIMITING

### Install
```bash
cd backend && npm install express-rate-limit rate-limit-redis ioredis
```

### File: `backend/src/middleware/rateLimiter.ts`
```typescript
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limit: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// AI endpoints: 20 requests per minute per user
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => {
    // Rate limit by Firebase UID if available, else by IP
    const uid = (req as any).user?.uid || req.ip;
    return `ai_${uid}`;
  },
  message: { error: 'AI request limit reached. Please wait a moment.' }
});

// Auth endpoints: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' }
});

// Cover letter / heavy AI: 5 per hour per user
export const heavyAILimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    const uid = (req as any).user?.uid || req.ip;
    return `heavy_ai_${uid}`;
  },
  message: { error: 'Cover letter generation limit reached. Upgrade to Pro for unlimited.' }
});

// Application submit: 10 per hour per user (prevent spam applications)
export const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => {
    const uid = (req as any).user?.uid || req.ip;
    return `apply_${uid}`;
  },
  message: { error: 'Application submission limit reached. Try again in an hour.' }
});
```

### File: `backend/src/index.ts` — Add rate limiters (patch existing file)
```typescript
// ADD these imports at the top of backend/src/index.ts
import {
  generalLimiter,
  aiLimiter,
  authLimiter,
  heavyAILimiter,
  applicationLimiter
} from './middleware/rateLimiter';

// ADD after existing middleware setup (after cors, json parsing):
app.use('/api', generalLimiter);
app.use('/api/careerbot', aiLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/ai/cover-letter', heavyAILimiter);
app.use('/api/users/sync', authLimiter);
app.use('/api/applications', applicationLimiter);
// Note: applicationLimiter only applies to POST, so add method check inside the route
// OR limit by method:
// app.post('/api/applications', applicationLimiter);
```

---

## 2. MULTI-TENANCY

### SQL Migration: `backend/src/database/migrations/002_multi_tenancy.sql`
```sql
-- Run this migration ONCE against your PostgreSQL database

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,            -- URL-safe name, e.g. "acme-corp"
  domain TEXT,                          -- e.g. "acme.com" for auto-assign on login
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'scale', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_job_postings INTEGER DEFAULT 3,   -- enforced by tier
  max_recruiter_seats INTEGER DEFAULT 1,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add company_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_ats_scans INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_scans_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Add company_id to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id) ON DELETE CASCADE;

-- Create a default company for existing jobs
INSERT INTO companies (id, name, slug) VALUES ('default-company-001', 'Default Company', 'default') ON CONFLICT DO NOTHING;
UPDATE jobs SET company_id = 'default-company-001' WHERE company_id IS NULL;

-- Step 4: Add company_id to applications (for admin isolation)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id) ON DELETE SET NULL;
UPDATE applications SET company_id = 'default-company-001' WHERE company_id IS NULL;

-- Step 5: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON companies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

-- Step 6: Reputation score columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_breakdown JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_applications INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_pass_rate REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_ats_score REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_skills_count INTEGER DEFAULT 0;
```

### File: `backend/src/middleware/tenantMiddleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import pool from '../database/db';

// Attach company context to every authenticated admin request
export const requireCompanyContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query(
      'SELECT u.*, c.subscription_tier as company_tier, c.max_job_postings, c.max_recruiter_seats FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.firebase_uid = $1',
      [uid]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    (req as any).dbUser = result.rows[0];
    (req as any).companyId = result.rows[0].company_id;
    next();
  } catch (err) {
    next(err);
  }
};

// Enforce job posting limits per subscription tier
export const enforceJobLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return next(); // skip for candidates

    const [company, jobCount] = await Promise.all([
      pool.query('SELECT max_job_postings, subscription_tier FROM companies WHERE id = $1', [companyId]),
      pool.query('SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND is_active = true', [companyId])
    ]);

    const limit = company.rows[0]?.max_job_postings || 3;
    const current = parseInt(jobCount.rows[0].count);

    if (current >= limit) {
      return res.status(403).json({
        error: `Job posting limit reached (${limit}/${limit}). Upgrade your plan to post more jobs.`,
        upgrade_url: '/billing'
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Enforce ATS scan limits for free tier candidates
export const enforceATSLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) return next();

    const user = await pool.query(
      'SELECT subscription_tier, monthly_ats_scans, monthly_scans_reset_at FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (!user.rows[0]) return next();
    const u = user.rows[0];

    // Reset monthly counter if needed
    const resetDate = new Date(u.monthly_scans_reset_at);
    const now = new Date();
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      await pool.query(
        'UPDATE users SET monthly_ats_scans = 0, monthly_scans_reset_at = NOW() WHERE firebase_uid = $1',
        [uid]
      );
      u.monthly_ats_scans = 0;
    }

    // Free tier: 3 scans/month
    if (u.subscription_tier === 'free' && u.monthly_ats_scans >= 3) {
      return res.status(403).json({
        error: 'Free tier ATS scan limit reached (3/month). Upgrade to Pro for unlimited scans.',
        upgrade_url: '/billing',
        scans_used: u.monthly_ats_scans,
        scans_limit: 3
      });
    }

    // Increment counter
    await pool.query('UPDATE users SET monthly_ats_scans = monthly_ats_scans + 1 WHERE firebase_uid = $1', [uid]);
    next();
  } catch (err) {
    next(err);
  }
};
```

### Update existing routes to filter by company_id

#### Patch: `backend/src/routes/jobs.ts`
```typescript
// In GET / (active jobs list) — ADD company_id filter for admin routes
// The public job board doesn't filter by company — candidates see all jobs
// The admin job list filters by the admin's company

// FIND the admin jobs route (GET /all) and modify the query:
const companyId = (req as any).companyId; // set by requireCompanyContext middleware
const query = companyId
  ? 'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC'
  : 'SELECT * FROM jobs ORDER BY created_at DESC';
const params = companyId ? [companyId] : [];
const result = await pool.query(query, params);

// In POST / (create job) — ADD company_id to insert:
const companyId = (req as any).companyId;
// Add company_id to your INSERT query values
```

#### Patch: `backend/src/routes/applications.ts`
```typescript
// In GET / (admin applications list) — ADD company filter:
const companyId = (req as any).companyId;
// Add: AND a.company_id = $N to queries when companyId exists

// In POST / (candidate submits application) — set company_id from the job:
const job = await pool.query('SELECT company_id FROM jobs WHERE id = $1', [jobId]);
const companyId = job.rows[0]?.company_id;
// Add company_id to your INSERT INTO applications query
```

---

## 3. STRIPE BILLING

### Install
```bash
cd backend && npm install stripe
cd frontend && npm install @stripe/stripe-js @stripe/react-stripe-js
```

### File: `backend/src/services/stripeService.ts`
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export const PLANS = {
  candidate_pro: {
    monthly: process.env.STRIPE_CANDIDATE_PRO_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_CANDIDATE_PRO_ANNUAL_PRICE_ID!,
    name: 'Candidate Pro',
    features: ['Unlimited ATS scans', 'Unlimited mock interviews', 'Career bot', 'Reputation score']
  },
  recruiter_starter: {
    monthly: process.env.STRIPE_RECRUITER_STARTER_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_RECRUITER_STARTER_ANNUAL_PRICE_ID!,
    name: 'Recruiter Starter',
    features: ['5 active job postings', 'AI scoring', 'Basic analytics', '1 seat']
  },
  recruiter_scale: {
    monthly: process.env.STRIPE_RECRUITER_SCALE_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_RECRUITER_SCALE_ANNUAL_PRICE_ID!,
    name: 'Recruiter Scale',
    features: ['Unlimited jobs', 'Video interviews', 'Advanced analytics', '5 seats']
  }
};

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  isCompanyPlan,
  companyId
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  isCompanyPlan: boolean;
  companyId?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId,
      companyId: companyId || '',
      isCompanyPlan: String(isCompanyPlan)
    },
    success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/billing`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14  // 14-day free trial
    }
  });
  return session;
}

export async function createPortalSession(stripeCustomerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/billing`
  });
  return session;
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  return event;
}

export { stripe };
```

### File: `backend/src/routes/billing.ts`
```typescript
import { Router, Request, Response } from 'express';
import pool from '../database/db';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
  stripe,
  PLANS
} from '../services/stripeService';
import express from 'express';

const router = Router();

// GET /api/billing/plans — return available plans
router.get('/plans', (req: Request, res: Response) => {
  res.json({ plans: PLANS });
});

// POST /api/billing/checkout — create Stripe checkout session
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, planKey } = req.body;
    const uid = (req as any).user?.uid;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [uid]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isCompanyPlan = planKey?.startsWith('recruiter');
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      priceId,
      isCompanyPlan,
      companyId: user.company_id
    });

    res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/portal — create Stripe billing portal session
router.post('/portal', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.uid;
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE firebase_uid = $1',
      [uid]
    );
    const user = userResult.rows[0];
    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }

    const portal = await createPortalSession(user.stripe_customer_id);
    res.json({ url: portal.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/status — get current subscription info
router.get('/status', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.uid;
    const result = await pool.query(
      `SELECT u.subscription_tier, u.stripe_subscription_id, u.monthly_ats_scans, u.monthly_scans_reset_at,
              c.subscription_tier as company_tier, c.max_job_postings
       FROM users u LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.firebase_uid = $1`,
      [uid]
    );
    res.json(result.rows[0] || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/webhook — Stripe webhook handler
// IMPORTANT: This route MUST use raw body parser, not json()
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = await handleWebhookEvent(req.body, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { userId, companyId, isCompanyPlan } = session.metadata;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Get subscription details to find tier
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const tier = getTierFromPriceId(priceId);

        if (isCompanyPlan === 'true' && companyId) {
          // Update company subscription
          await pool.query(
            `UPDATE companies SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_tier = $3,
             subscription_status = 'active', max_job_postings = $4, updated_at = NOW() WHERE id = $5`,
            [customerId, subscriptionId, tier, getJobLimit(tier), companyId]
          );
        } else {
          // Update candidate subscription
          await pool.query(
            `UPDATE users SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_tier = $3 WHERE id = $4`,
            [customerId, subscriptionId, tier, userId]
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;
        const tier = status === 'active' ? getTierFromPriceId(priceId) : 'free';

        // Update user
        await pool.query(
          `UPDATE users SET subscription_tier = $1 WHERE stripe_subscription_id = $2`,
          [tier, subscription.id]
        );
        // Update company
        await pool.query(
          `UPDATE companies SET subscription_tier = $1, subscription_status = $2, max_job_postings = $3 WHERE stripe_subscription_id = $4`,
          [tier, status, getJobLimit(tier), subscription.id]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await pool.query(
          `UPDATE users SET subscription_tier = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        await pool.query(
          `UPDATE companies SET subscription_tier = 'free', subscription_status = 'cancelled', max_job_postings = 3 WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

function getTierFromPriceId(priceId: string): string {
  const { PLANS } = require('../services/stripeService');
  for (const [key, plan] of Object.entries(PLANS) as any) {
    if (plan.monthly === priceId || plan.annual === priceId) return key;
  }
  return 'free';
}

function getJobLimit(tier: string): number {
  const limits: Record<string, number> = {
    recruiter_starter: 5,
    recruiter_scale: 999,
    enterprise: 9999,
    free: 3
  };
  return limits[tier] || 3;
}

export default router;
```

### Register billing routes in `backend/src/index.ts`
```typescript
// ADD import
import billingRoutes from './routes/billing';

// ADD route — NOTE: webhook must be BEFORE json middleware
app.use('/api/billing/webhook', billingRoutes); // raw body needed
app.use(express.json()); // existing json middleware
// ... other routes ...
app.use('/api/billing', billingRoutes);
```

---

## 4. SELF-HOSTED LLM

### File: `backend/src/services/llmService.ts`
```typescript
// Intelligent LLM router: local Ollama first → OpenRouter fallback
// This reduces your AI costs to near zero for most requests

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

// Tasks best suited for local models (deterministic, structured)
const LOCAL_CAPABLE_TASKS = ['ats_score', 'cover_letter', 'quiz_generate', 'interview_feedback'];

// Tasks that benefit from cloud models (nuanced reasoning, web search)
const CLOUD_PREFERRED_TASKS = ['career_chat', 'profile_optimization', 'web_search_synthesis'];

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

  const useLocal = !forceCloud &&
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
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens
      },
      format: options.jsonMode ? 'json' : undefined
    }),
    signal: AbortSignal.timeout(30000) // 30s timeout
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

  const data = await response.json();
  return {
    text: data.message?.content || '',
    model,
    provider: 'ollama',
    tokens_used: data.eval_count
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
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://jobflow.ai',
      'X-Title': 'JobFlow AI'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined
    })
  });

  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    model,
    provider: 'openrouter',
    tokens_used: data.usage?.total_tokens
  };
}

// Streaming version for cover letter generation
export async function streamLLM(
  messages: LLMMessage[],
  onChunk: (text: string) => void,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<void> {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.8
    })
  });

  if (!response.ok || !response.body) throw new Error('Stream failed');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content || '';
        if (text) onChunk(text);
      } catch {}
    }
  }
}
```

### Update ATS analysis to use new LLM service

#### Patch: `backend/src/routes/careerbot.ts` — replace OpenRouter calls with `callLLM`
```typescript
// REPLACE your existing OpenRouter fetch calls with:
import { callLLM, streamLLM } from '../services/llmService';

// For ATS analysis:
const result = await callLLM([
  { role: 'system', content: 'You are an expert ATS analyzer. Respond in JSON only.' },
  { role: 'user', content: `Analyze this resume against the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}` }
], {
  task: 'ats_score',
  jsonMode: true,
  maxTokens: 800,
  temperature: 0.3
});
const analysis = JSON.parse(result.text);

// For cover letter streaming:
await streamLLM([
  { role: 'system', content: 'Write compelling cover letters.' },
  { role: 'user', content: `Write a cover letter for: ${jobTitle} at ${company}` }
], (chunk) => res.write(chunk), { maxTokens: 1200 });
```

### Ollama Setup Script: `scripts/setup-ollama.sh`
```bash
#!/bin/bash
# Run this on your server to set up Ollama

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
ollama serve &
sleep 3

# Pull models (choose based on your server specs)
# 8B model — works on 16GB RAM, ~5GB disk
ollama pull llama3.1:8b

# For better quality on 32GB+ RAM:
# ollama pull llama3.1:70b

# For fastest responses (8GB RAM):
# ollama pull llama3.2:3b

# Verify
ollama list
echo "Ollama is ready. Set OLLAMA_ENABLED=true and OLLAMA_BASE_URL=http://localhost:11434"
```

---

## 5. WEBSOCKETS

### Install
```bash
cd backend && npm install socket.io
cd frontend && npm install socket.io-client
```

### File: `backend/src/services/socketService.ts`
```typescript
import { Server as IOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import pool from '../database/db';

let io: IOServer;

// Map of firebase_uid -> socket.id for targeted notifications
const userSocketMap = new Map<string, string>();

export function initSocketServer(httpServer: HTTPServer) {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // Client sends their Firebase UID to register
    socket.on('register', (uid: string) => {
      if (uid) {
        userSocketMap.set(uid, socket.id);
        socket.join(`user:${uid}`);
        console.log(`[Socket] User ${uid} registered on socket ${socket.id}`);
      }
    });

    // Admin joins their company room for live application feed
    socket.on('join_company', (companyId: string) => {
      socket.join(`company:${companyId}`);
      console.log(`[Socket] Socket ${socket.id} joined company room ${companyId}`);
    });

    socket.on('disconnect', () => {
      // Remove from map
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userSocketMap.delete(uid);
          break;
        }
      }
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

// Send notification to a specific user by Firebase UID
export function notifyUser(
  firebaseUid: string,
  event: string,
  data: any
) {
  if (io) {
    io.to(`user:${firebaseUid}`).emit(event, data);
  }
}

// Broadcast to all admins of a company (e.g., new application arrived)
export function notifyCompany(
  companyId: string,
  event: string,
  data: any
) {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
}

export function getIO() {
  return io;
}
```

### Patch: `backend/src/index.ts` — switch to http server
```typescript
// REPLACE your existing server creation:
import { createServer } from 'http';
import { initSocketServer } from './services/socketService';

// REPLACE: app.listen(PORT, ...)
// WITH:
const httpServer = createServer(app);
initSocketServer(httpServer);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Patch: `backend/src/routes/applications.ts` — emit on status change
```typescript
import { notifyUser, notifyCompany } from '../services/socketService';

// In PATCH /:id/status route, AFTER updating the DB:
const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
const app = applicationResult.rows[0];

// Notify the candidate in real-time
notifyUser(app.user_id, 'application_status_update', {
  applicationId: id,
  newStatus: status,
  position: app.position,
  company: app.company || 'the company',
  message: `Your application for ${app.position} has been updated to: ${status}`
});

// Notify other admins in the same company
notifyCompany(app.company_id, 'application_updated', {
  applicationId: id,
  status,
  candidateName: app.full_name
});
```

### File: `frontend/src/hooks/useSocket.ts`
```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    }

    socketRef.current = socketInstance;
    socketInstance.emit('register', user.uid);

    // Admin: join company room
    if (user.role === 'admin' && (user as any).company_id) {
      socketInstance.emit('join_company', (user as any).company_id);
    }

    return () => {
      // Don't disconnect on unmount — keep persistent connection
    };
  }, [user?.uid]);

  return socketRef.current;
}

// Hook for real-time notifications
export function useRealTimeNotifications(onNotification: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('application_status_update', onNotification);
    socket.on('application_updated', onNotification);

    return () => {
      socket.off('application_status_update', onNotification);
      socket.off('application_updated', onNotification);
    };
  }, [socket, onNotification]);
}
```

### Patch: `frontend/src/components/NotificationBell.tsx`
```typescript
// ADD to existing NotificationBell component:
import { useRealTimeNotifications } from '../hooks/useSocket';

// Inside the component, add:
useRealTimeNotifications((data) => {
  // Increment unread count instantly without polling
  setUnreadCount(prev => prev + 1);
  // Optionally show a toast
  console.log('[Real-time] New notification:', data);
});
```

---

## 6. GDPR

### SQL Migration: `backend/src/database/migrations/003_gdpr.sql`
```sql
-- Audit log table for GDPR compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,                        -- Firebase UID of actor
  entity_type TEXT NOT NULL,           -- 'user', 'application', 'job', etc.
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,                -- 'view', 'update', 'delete', 'export', 'login'
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Data deletion requests
CREATE TABLE IF NOT EXISTS deletion_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  firebase_uid TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

### File: `backend/src/routes/gdpr.ts`
```typescript
import { Router, Request, Response } from 'express';
import pool from '../database/db';

const router = Router();

// GET /api/gdpr/export — export all user data (GDPR Article 20)
router.get('/export', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.uid;

    const [user, applications, chatSessions, interviews, notifications] = await Promise.all([
      pool.query('SELECT id, email, name, phone, headline, skills, verified_skills, created_at FROM users WHERE firebase_uid = $1', [uid]),
      pool.query(`SELECT a.id, a.position, a.status, a.cover_letter, a.ai_score, a.created_at, j.title, j.company
                  FROM applications a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.user_id = $1`, [uid]),
      pool.query('SELECT id, bot_type, title, created_at FROM chat_sessions WHERE user_id = $1', [uid]),
      pool.query('SELECT id, score, feedback, created_at FROM interview_sessions WHERE candidate_id = (SELECT id FROM users WHERE firebase_uid = $1)', [uid]),
      pool.query('SELECT title, message, type, created_at FROM notifications WHERE user_id = $1', [uid])
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_profile: user.rows[0] || null,
      applications: applications.rows,
      chat_sessions: chatSessions.rows,
      interview_history: interviews.rows,
      notifications: notifications.rows
    };

    // Log the export for audit trail
    await pool.query(
      'INSERT INTO audit_logs (user_id, entity_type, entity_id, action) VALUES ($1, $2, $3, $4)',
      [uid, 'user', user.rows[0]?.id, 'export']
    );

    res.setHeader('Content-Disposition', `attachment; filename="jobflow-data-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gdpr/delete-request — request account deletion (GDPR Article 17)
router.post('/delete-request', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.uid;
    const userResult = await pool.query('SELECT id, email FROM users WHERE firebase_uid = $1', [uid]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check no pending deletion request
    const existing = await pool.query(
      'SELECT id FROM deletion_requests WHERE firebase_uid = $1 AND status IN ($2, $3)',
      [uid, 'pending', 'processing']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A deletion request is already in progress.' });
    }

    await pool.query(
      'INSERT INTO deletion_requests (user_id, firebase_uid, email) VALUES ($1, $2, $3)',
      [user.id, uid, user.email]
    );

    res.json({
      message: 'Deletion request received. Your account and all associated data will be permanently deleted within 30 days.',
      request_id: user.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gdpr/execute/:userId — admin executes deletion (or scheduled job)
router.delete('/execute/:userId', async (req: Request, res: Response) => {
  // Protect this route: only internal service or super-admin can call
  const internalKey = req.headers['x-internal-key'];
  if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Anonymize applications (keep for recruiter records, remove PII)
    await client.query(
      `UPDATE applications SET
        full_name = 'Deleted User', email = 'deleted@deleted.com', phone = NULL,
        cover_letter = '[DELETED]', resume_path = NULL, resume_filename = NULL
       WHERE user_id = $1`,
      [userId]
    );

    // Delete personal data
    await client.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await client.query(
      'DELETE FROM interview_sessions WHERE candidate_id = (SELECT id FROM users WHERE firebase_uid = $1)',
      [userId]
    );

    // Anonymize the user record itself
    await client.query(
      `UPDATE users SET
        email = 'deleted-' || id || '@deleted.com',
        name = 'Deleted User', phone = NULL, photo_url = NULL,
        headline = NULL, skills = NULL, verified_skills = '[]',
        firebase_uid = 'deleted-' || id
       WHERE firebase_uid = $1`,
      [userId]
    );

    // Mark deletion request complete
    await client.query(
      `UPDATE deletion_requests SET status = 'completed', completed_at = NOW() WHERE firebase_uid = $1`,
      [userId]
    );

    await client.query('COMMIT');
    res.json({ message: 'User data deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
```

### Register in `backend/src/index.ts`
```typescript
import gdprRoutes from './routes/gdpr';
app.use('/api/gdpr', gdprRoutes); // requires auth middleware
```

---

## 7. HEALTH ENDPOINT

### File: `backend/src/routes/health.ts`
```typescript
import { Router, Request, Response } from 'express';
import pool from '../database/db';

const router = Router();
const startTime = Date.now();

// GET /api/health — basic (used by load balancers)
router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/health/detailed — full system status
router.get('/detailed', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {};
  let overallHealthy = true;

  // 1. Database
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const poolStat = pool as any;
    checks.database = {
      status: 'ok',
      latency_ms: Date.now() - start,
      pool_total: poolStat.totalCount || 0,
      pool_idle: poolStat.idleCount || 0,
      pool_waiting: poolStat.waitingCount || 0
    };
  } catch (err: any) {
    checks.database = { status: 'error', error: err.message };
    overallHealthy = false;
  }

  // 2. Ollama (if enabled)
  if (process.env.OLLAMA_ENABLED === 'true') {
    try {
      const start = Date.now();
      const res2 = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`);
      const data = await res2.json();
      checks.ollama = {
        status: res2.ok ? 'ok' : 'error',
        latency_ms: Date.now() - start,
        models: data.models?.map((m: any) => m.name) || []
      };
    } catch (err: any) {
      checks.ollama = { status: 'error', error: err.message };
    }
  }

  // 3. OpenRouter (ping)
  try {
    const start = Date.now();
    const r = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    checks.openrouter = { status: r.ok ? 'ok' : 'degraded', latency_ms: Date.now() - start };
  } catch {
    checks.openrouter = { status: 'error' };
  }

  // 4. Cloudinary (check env vars exist)
  checks.cloudinary = {
    status: process.env.CLOUDINARY_URL ? 'configured' : 'missing_config'
  };

  // 5. Stripe
  checks.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing_config'
  };

  // 6. Application stats
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM applications) as total_applications,
        (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs,
        (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '24 hours') as apps_last_24h
    `);
    checks.stats = stats.rows[0];
  } catch {}

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks
  });
});

export default router;
```

### Register in `backend/src/index.ts`
```typescript
import healthRoutes from './routes/health';
// ADD before rate limiters so health checks bypass limits:
app.use('/api/health', healthRoutes);
```

---

## 8. PGVECTOR SEMANTIC SEARCH

### SQL Migration: `backend/src/database/migrations/004_vector_search.sql`
```sql
-- Enable pgvector extension (must be superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_embedding vector(384);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_embedding vector(384);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills_embedding vector(384);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS applications_embedding_idx ON applications USING hnsw (resume_embedding vector_cosine_ops);
```

### File: `backend/src/services/embeddingService.ts`
```typescript
// Uses a local embedding model (no API cost)
// We use nomic-embed-text via Ollama — 384 dimensions, very fast

export async function getEmbedding(text: string): Promise<number[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const response = await fetch(`${baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
      prompt: text.slice(0, 8000) // truncate to model limit
    })
  });

  if (!response.ok) throw new Error(`Embedding error: ${response.status}`);
  const data = await response.json();
  return data.embedding;
}

// Fallback: use OpenRouter/OpenAI embeddings
export async function getEmbeddingCloud(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text
    })
  });
  const data = await response.json();
  return data.data[0].embedding;
}

export async function safeGetEmbedding(text: string): Promise<number[] | null> {
  try {
    if (process.env.OLLAMA_ENABLED === 'true') {
      return await getEmbedding(text);
    }
    return await getEmbeddingCloud(text);
  } catch (err) {
    console.warn('[Embedding] Failed:', err);
    return null;
  }
}
```

### File: `backend/src/routes/search.ts`
```typescript
import { Router, Request, Response } from 'express';
import pool from '../database/db';
import { safeGetEmbedding } from '../services/embeddingService';

const router = Router();

// POST /api/search/jobs — semantic job search
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const embedding = await safeGetEmbedding(query);

    let result;
    if (embedding) {
      // Semantic search with vector similarity
      const vectorStr = `[${embedding.join(',')}]`;
      result = await pool.query(
        `SELECT id, title, company, location, type, department, salary_range,
                1 - (description_embedding <=> $1::vector) AS similarity_score
         FROM jobs
         WHERE is_active = true AND description_embedding IS NOT NULL
         ORDER BY description_embedding <=> $1::vector
         LIMIT $2`,
        [vectorStr, limit]
      );
    } else {
      // Fallback: full-text search
      result = await pool.query(
        `SELECT id, title, company, location, type, department, salary_range, 0.5 AS similarity_score
         FROM jobs
         WHERE is_active = true
         AND (to_tsvector('english', title || ' ' || COALESCE(description,'') || ' ' || COALESCE(requirements,''))
              @@ plainto_tsquery('english', $1))
         LIMIT $2`,
        [query, limit]
      );
    }

    res.json({ jobs: result.rows, search_type: embedding ? 'semantic' : 'fulltext' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/search/candidates — semantic candidate search (admin)
router.post('/candidates', async (req: Request, res: Response) => {
  try {
    const { query, jobId, limit = 20 } = req.body;
    const companyId = (req as any).companyId;

    let embedding: number[] | null = null;

    if (jobId) {
      // Use the job's embedding to find matching candidates
      const jobResult = await pool.query('SELECT description_embedding FROM jobs WHERE id = $1', [jobId]);
      if (jobResult.rows[0]?.description_embedding) {
        embedding = jobResult.rows[0].description_embedding;
      }
    } else if (query) {
      embedding = await safeGetEmbedding(query);
    }

    let result;
    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      result = await pool.query(
        `SELECT a.id, a.full_name, a.email, a.position, a.ai_score, a.status,
                1 - (a.resume_embedding <=> $1::vector) AS match_score
         FROM applications a
         WHERE a.company_id = $2 AND a.resume_embedding IS NOT NULL
         ORDER BY a.resume_embedding <=> $1::vector
         LIMIT $3`,
        [vectorStr, companyId, limit]
      );
    } else {
      result = await pool.query(
        `SELECT id, full_name, email, position, ai_score, status, 0.5 AS match_score
         FROM applications WHERE company_id = $1 ORDER BY ai_score DESC LIMIT $2`,
        [companyId, limit]
      );
    }

    res.json({ candidates: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

### Pull embedding model for Ollama
```bash
ollama pull nomic-embed-text
```

---

## 9. REPUTATION SCORE

### File: `backend/src/services/reputationService.ts`
```typescript
import pool from '../database/db';

interface ReputationBreakdown {
  verified_skills: number;      // 0-30 points: 5pts per verified skill, max 30
  ats_scores: number;           // 0-25 points: avg ATS score / 4
  interview_performance: number; // 0-25 points: avg interview score / 4
  application_quality: number;   // 0-10 points: completion, cover letter quality
  profile_completeness: number;  // 0-10 points: all fields filled
}

export async function recalculateReputation(userId: string): Promise<number> {
  const [user, applications, interviews] = await Promise.all([
    pool.query('SELECT * FROM users WHERE id = $1', [userId]),
    pool.query(
      'SELECT ai_score, cover_letter, status FROM applications WHERE user_id = (SELECT firebase_uid FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT 20',
      [userId]
    ),
    pool.query(
      'SELECT score FROM interview_sessions WHERE candidate_id = $1 AND score IS NOT NULL ORDER BY created_at DESC LIMIT 10',
      [userId]
    )
  ]);

  const u = user.rows[0];
  if (!u) return 0;

  const breakdown: ReputationBreakdown = {
    verified_skills: 0,
    ats_scores: 0,
    interview_performance: 0,
    application_quality: 0,
    profile_completeness: 0
  };

  // Verified skills (max 30 pts)
  const verifiedSkills = Array.isArray(u.verified_skills) ? u.verified_skills.length : 0;
  breakdown.verified_skills = Math.min(30, verifiedSkills * 5);

  // ATS scores (max 25 pts)
  const scoredApps = applications.rows.filter(a => a.ai_score != null);
  if (scoredApps.length > 0) {
    const avgScore = scoredApps.reduce((s, a) => s + a.ai_score, 0) / scoredApps.length;
    breakdown.ats_scores = Math.round(avgScore / 4);
  }

  // Interview performance (max 25 pts)
  if (interviews.rows.length > 0) {
    const avgInterview = interviews.rows.reduce((s, i) => s + i.score, 0) / interviews.rows.length;
    breakdown.interview_performance = Math.round(avgInterview / 4);
  }

  // Application quality (max 10 pts)
  const appsWithCoverLetter = applications.rows.filter(a => a.cover_letter && a.cover_letter.length > 100);
  const qualityScore = (appsWithCoverLetter.length / Math.max(applications.rows.length, 1)) * 10;
  breakdown.application_quality = Math.round(qualityScore);

  // Profile completeness (max 10 pts)
  const fields = [u.name, u.phone, u.headline, u.skills, u.photo_url];
  const filled = fields.filter(Boolean).length;
  breakdown.profile_completeness = Math.round((filled / fields.length) * 10);

  const totalScore = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0));

  // Save to DB
  await pool.query(
    `UPDATE users SET
      reputation_score = $1,
      reputation_breakdown = $2,
      total_applications = $3,
      avg_ats_score = $4,
      verified_skills_count = $5,
      updated_at = NOW()
     WHERE id = $6`,
    [
      totalScore,
      JSON.stringify(breakdown),
      applications.rows.length,
      breakdown.ats_scores * 4,
      verifiedSkills,
      userId
    ]
  );

  return totalScore;
}
```

### Add endpoint to trigger recalculation

#### Patch: `backend/src/routes/users.ts`
```typescript
import { recalculateReputation } from '../services/reputationService';

// ADD this route:
// GET /api/users/me/reputation
router.get('/me/reputation', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.uid;
    const userResult = await pool.query('SELECT id FROM users WHERE firebase_uid = $1', [uid]);
    const userId = userResult.rows[0]?.id;
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const score = await recalculateReputation(userId);
    const userData = await pool.query(
      'SELECT reputation_score, reputation_breakdown, total_applications, avg_ats_score, verified_skills_count FROM users WHERE id = $1',
      [userId]
    );
    res.json(userData.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Also call recalculateReputation() after:
// - Skill quiz completion (in ai routes)
// - Application submission (in applications routes)
// - Interview completion (in ai routes)
```

---

## 10. EMAIL QUEUE WITH BULL + REDIS

### Install
```bash
cd backend && npm install bullmq ioredis nodemailer
```

### File: `backend/src/services/emailQueue.ts`
```typescript
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const emailQueue = new Queue('emails', { connection });

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  type: 'application_received' | 'status_update' | 'interview_invite' | 'welcome';
}

// Worker that processes emails
const worker = new Worker<EmailJob>('emails', async (job: Job<EmailJob>) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"JobFlow AI" <${process.env.SMTP_FROM || 'noreply@jobflow.ai'}>`,
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.html
  });

  console.log(`[EmailQueue] Sent ${job.data.type} to ${job.data.to}`);
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`[EmailQueue] Job failed:`, err.message);
});

// Email templates
export const emailTemplates = {
  applicationReceived: (candidateName: string, position: string, company: string) => ({
    subject: `Application received — ${position} at ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1">JobFlow AI</h2>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${position}</strong> at <strong>${company}</strong> has been received.</p>
        <p>We'll review your application and keep you updated on its status.</p>
        <p>Track your application: <a href="${process.env.FRONTEND_URL}/my-applications">My Applications</a></p>
        <hr/>
        <p style="color:#888;font-size:12px">JobFlow AI — Your AI-powered career companion</p>
      </div>
    `
  }),

  statusUpdate: (candidateName: string, position: string, company: string, newStatus: string) => ({
    subject: `Application update — ${position} at ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1">JobFlow AI</h2>
        <p>Hi ${candidateName},</p>
        <p>Your application status for <strong>${position}</strong> at <strong>${company}</strong> has been updated to:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <strong style="font-size:18px;text-transform:capitalize">${newStatus}</strong>
        </div>
        <p><a href="${process.env.FRONTEND_URL}/my-applications">View your application →</a></p>
        <hr/>
        <p style="color:#888;font-size:12px">JobFlow AI</p>
      </div>
    `
  })
};

// Helper to queue an email
export async function sendEmail(emailData: EmailJob) {
  await emailQueue.add(emailData.type, emailData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50
  });
}
```

### Patch: `backend/src/routes/applications.ts` — send emails
```typescript
import { sendEmail, emailTemplates } from '../services/emailQueue';

// After application is created:
const template = emailTemplates.applicationReceived(fullName, position, job.company);
await sendEmail({ to: email, ...template, type: 'application_received' });

// After status update:
const template2 = emailTemplates.statusUpdate(app.full_name, app.position, 'the company', newStatus);
await sendEmail({ to: app.email, ...template2, type: 'status_update' });
```

---

## 11. AUDIT LOGGING

### File: `backend/src/middleware/auditLog.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import pool from '../database/db';

// Lightweight audit logger middleware
export function auditLog(entityType: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run after response
    res.on('finish', async () => {
      if (res.statusCode >= 400) return; // Don't log failed requests

      try {
        const uid = (req as any).user?.uid || 'anonymous';
        const entityId = req.params.id || req.params.applicationId || '';

        await pool.query(
          `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uid,
            entityType,
            entityId,
            action,
            JSON.stringify({ method: req.method, path: req.path, body_keys: Object.keys(req.body || {}) }),
            req.ip,
            req.headers['user-agent']
          ]
        );
      } catch {} // Never break requests due to audit logging
    });

    next();
  };
}
```

### Usage in routes:
```typescript
import { auditLog } from '../middleware/auditLog';

// In applications router:
router.patch('/:id/status', auditLog('application', 'status_update'), async (req, res) => { ... });
router.delete('/:id', auditLog('application', 'delete'), async (req, res) => { ... });

// In admin routes:
router.get('/:id', auditLog('application', 'view'), async (req, res) => { ... });
```

---

## 12. FRONTEND BILLING UI

### File: `frontend/src/pages/Billing.tsx`
```tsx
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    key: 'candidate_free',
    name: 'Free',
    price: 0,
    target: 'candidate',
    features: ['3 ATS scans/month', 'Browse jobs', 'Basic career bot', '1 mock interview'],
    cta: 'Current Plan'
  },
  {
    key: 'candidate_pro',
    name: 'Candidate Pro',
    price: 12,
    target: 'candidate',
    priceId: 'REPLACE_WITH_STRIPE_PRICE_ID',
    features: ['Unlimited ATS scans', 'Unlimited mock interviews', 'Full career bot', 'Reputation score', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    key: 'recruiter_starter',
    name: 'Recruiter Starter',
    price: 99,
    target: 'recruiter',
    priceId: 'REPLACE_WITH_STRIPE_PRICE_ID',
    features: ['5 active job postings', 'AI resume scoring', 'Basic analytics', '1 recruiter seat'],
    cta: 'Start Free Trial'
  },
  {
    key: 'recruiter_scale',
    name: 'Recruiter Scale',
    price: 299,
    target: 'recruiter',
    priceId: 'REPLACE_WITH_STRIPE_PRICE_ID',
    features: ['Unlimited job postings', 'AI video interviews', 'Advanced analytics', '5 recruiter seats', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true
  }
];

export default function Billing() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/billing/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const handleSubscribe = async (plan: any) => {
    if (!plan.priceId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/billing/checkout', {
        priceId: plan.priceId,
        planKey: plan.key
      });
      window.location.href = data.sessionUrl;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/billing/portal');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = PLANS.filter(p =>
    user?.role === 'admin' ? p.target === 'recruiter' || p.target === 'candidate' : p.target === 'candidate' || p.key === 'candidate_free'
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500 }}>Billing & Plans</h1>
        {status?.subscription_tier && status.subscription_tier !== 'free' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Current plan: <strong style={{ textTransform: 'capitalize' }}>{status.subscription_tier.replace('_', ' ')}</strong>
            </p>
            <button onClick={handleManageBilling} disabled={loading}
              style={{ padding: '0.4rem 1rem', borderRadius: 6, border: '1px solid var(--color-border-primary)', background: 'transparent', cursor: 'pointer' }}>
              Manage Billing
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {filteredPlans.map(plan => {
          const isCurrent = status?.subscription_tier === plan.key;
          return (
            <div key={plan.key} style={{
              border: plan.popular ? '2px solid #6366f1' : '1px solid var(--color-border-tertiary)',
              borderRadius: 12, padding: '1.5rem', position: 'relative',
              background: 'var(--color-background-secondary)'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#6366f1', color: '#fff', fontSize: 11, padding: '2px 12px',
                  borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap'
                }}>Most Popular</div>
              )}
              <h3 style={{ fontWeight: 500, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
                ${plan.price}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || loading || !plan.priceId}
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: isCurrent ? 'var(--color-background-tertiary)' : plan.popular ? '#6366f1' : 'var(--color-border-secondary)',
                  color: isCurrent ? 'var(--color-text-secondary)' : plan.popular ? '#fff' : 'var(--color-text-primary)',
                  fontWeight: 500, fontSize: 14
                }}>
                {isCurrent ? 'Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: '2rem', fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
        14-day free trial on all paid plans. Cancel anytime. No credit card required to start.
      </p>
    </div>
  );
}
```

---

## 13. DOCKER COMPOSE FOR LOCAL SELF-HOSTED STACK

### File: `docker-compose.yml` (project root)
```yaml
version: '3.9'

services:
  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_DB: jobflow
      POSTGRES_USER: jobflow
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-jobflow_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./backend/src/database/migrations:/docker-entrypoint-initdb.d/migrations

  # Redis for Bull queue + rate limiting
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Ollama — local LLM server
  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Uncomment for GPU support:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # SearXNG — self-hosted web search (replaces Tavily)
  searxng:
    image: searxng/searxng:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SEARXNG_SECRET_KEY=${SEARXNG_SECRET:-jobflow_searxng_secret}
    volumes:
      - ./searxng-settings.yml:/etc/searxng/settings.yml

  # n8n — self-hosted workflow automation (replaces cloud n8n)
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-admin}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=jobflow
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD:-jobflow_dev}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  # Backend API
  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://jobflow:${POSTGRES_PASSWORD:-jobflow_dev}@postgres:5432/jobflow
      - REDIS_URL=redis://redis:6379
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_ENABLED=true
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend
  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  ollama_data:
  n8n_data:
```

### File: `searxng-settings.yml` (project root)
```yaml
use_default_settings: true
server:
  secret_key: "jobflow_searxng_secret"
  limiter: false
  image_proxy: true
ui:
  static_use_hash: true
search:
  safe_search: 0
  autocomplete: ""
  default_lang: ""
engines:
  - name: google
    engine: google
    shortcut: g
    disabled: false
  - name: bing
    engine: bing
    shortcut: b
    disabled: false
  - name: duckduckgo
    engine: duckduckgo
    shortcut: d
    disabled: false
```

### Setup commands
```bash
# Start all services
docker-compose up -d

# Pull Ollama models (run once)
docker-compose exec ollama ollama pull llama3.1:8b
docker-compose exec ollama ollama pull nomic-embed-text

# Run DB migrations
docker-compose exec backend npm run migrate

# Check all services are healthy
curl http://localhost:3001/api/health/detailed
```

---

## 14. ENVIRONMENT VARIABLES — COMPLETE REFERENCE

### `backend/.env` (complete updated file)
```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://jobflow:password@localhost:5432/jobflow
DATABASE_SSL=false   # true in production (Render)

# Redis
REDIS_URL=redis://localhost:6379

# LLM — Cloud (fallback)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini

# LLM — Local (primary when OLLAMA_ENABLED=true)
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Search
TAVILY_API_KEY=tvly-...         # keep as fallback
SEARXNG_BASE_URL=http://localhost:8080  # self-hosted search

# Firebase Auth
# (no server-side key needed — verify tokens client-side)

# Cloudinary (file storage)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Stripe Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CANDIDATE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_CANDIDATE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_RECRUITER_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_RECRUITER_STARTER_ANNUAL_PRICE_ID=price_...
STRIPE_RECRUITER_SCALE_MONTHLY_PRICE_ID=price_...
STRIPE_RECRUITER_SCALE_ANNUAL_PRICE_ID=price_...

# Email (for email queue)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password_here
SMTP_FROM=noreply@jobflow.ai

# n8n webhook
N8N_BASE_URL=http://localhost:5678
PA_NEW_APPLICATION_URL=http://localhost:5678/webhook/new-application

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Internal service key (for GDPR deletion endpoint)
INTERNAL_SERVICE_KEY=generate_a_random_64char_string_here
```

### `frontend/.env` (complete updated file)
```bash
VITE_API_BASE_URL=http://localhost:3001/api

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Stripe publishable key (safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Feature flags
VITE_ENABLE_REPUTATION_SCORE=true
VITE_ENABLE_BILLING=true
VITE_ENABLE_WEBSOCKETS=true
```

---

## INTEGRATION ORDER FOR AI AGENTS

Integrate in this exact order to avoid dependency issues:

```
1. Run SQL migrations: 002_multi_tenancy.sql → 003_gdpr.sql → 004_vector_search.sql
2. Install all backend packages: express-rate-limit, stripe, socket.io, bullmq, ioredis, nodemailer
3. Install all frontend packages: socket.io-client, @stripe/stripe-js
4. Create service files: llmService.ts, stripeService.ts, socketService.ts, emailQueue.ts, embeddingService.ts, reputationService.ts
5. Create middleware files: rateLimiter.ts, tenantMiddleware.ts, auditLog.ts
6. Create route files: billing.ts, gdpr.ts, health.ts, search.ts
7. Patch index.ts: add http server, socket init, new routes, rate limiters
8. Patch applications.ts: add company_id, notifications, email sending
9. Patch users.ts: add reputation endpoint
10. Patch careerbot.ts: replace direct OpenRouter calls with callLLM()
11. Add Billing.tsx page and add to router
12. Add useSocket.ts hook and patch NotificationBell.tsx
13. Set all environment variables
14. Pull Ollama models (if using self-hosted LLM)
15. Run: docker-compose up -d (for local dev) or deploy to server
16. Test: curl http://localhost:3001/api/health/detailed
```

---

## STRIPE SETUP CHECKLIST (do this in Stripe Dashboard)

```
1. Create account at stripe.com
2. Dashboard → Products → Add Product → "Candidate Pro" → Add Price ($12/month recurring)
3. Copy the Price ID (price_xxx) → paste into STRIPE_CANDIDATE_PRO_MONTHLY_PRICE_ID
4. Repeat for: Candidate Pro Annual, Recruiter Starter Monthly/Annual, Recruiter Scale Monthly/Annual
5. Dashboard → Developers → Webhooks → Add endpoint
   URL: https://your-backend.com/api/billing/webhook
   Events to listen: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
6. Copy Webhook Signing Secret → STRIPE_WEBHOOK_SECRET
7. Dashboard → Developers → API Keys → Copy Secret Key → STRIPE_SECRET_KEY
8. Enable test mode and test with card: 4242 4242 4242 4242
```

---
*Generated for JobFlow AI — Complete Enhancement Implementation*
*All code is TypeScript-compatible and uses the existing Express + PostgreSQL + React stack*