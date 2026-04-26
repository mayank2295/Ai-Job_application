import { Router, Request, Response } from 'express';
import { query as dbQuery } from '../database/db';
import { safeGetEmbedding } from '../services/embeddingService';

const router = Router();

// POST /api/search/jobs — semantic job search with full-text fallback
router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 10 } = req.body as { query?: string; limit?: number };
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }

    const embedding = await safeGetEmbedding(query);

    let result;
    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      result = await dbQuery(
        `SELECT id, title, company, location, type, department, salary_range,
                1 - (description_embedding <=> $1::vector) AS similarity_score
         FROM jobs
         WHERE is_active = true AND description_embedding IS NOT NULL
         ORDER BY description_embedding <=> $1::vector
         LIMIT $2`,
        [vectorStr, limit]
      );
    } else {
      // Full-text fallback
      result = await dbQuery(
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

// POST /api/search/candidates — semantic candidate search (admin only)
router.post('/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, jobId, limit = 20 } = req.body as { query?: string; jobId?: string; limit?: number };

    let embedding: number[] | null = null;

    if (jobId) {
      const jobResult = await dbQuery<{ description_embedding: number[] | null }>(
        'SELECT description_embedding FROM jobs WHERE id = $1',
        [jobId]
      );
      if (jobResult.rows[0]?.description_embedding) {
        embedding = jobResult.rows[0].description_embedding;
      }
    } else if (query) {
      embedding = await safeGetEmbedding(query);
    }

    let result;
    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      result = await dbQuery(
        `SELECT a.id, a.full_name, a.email, a.position, a.ai_score, a.status,
                1 - (a.resume_embedding <=> $1::vector) AS match_score
         FROM applications a
         WHERE a.resume_embedding IS NOT NULL
         ORDER BY a.resume_embedding <=> $1::vector
         LIMIT $2`,
        [vectorStr, limit]
      );
    } else {
      result = await dbQuery(
        `SELECT id, full_name, email, position, ai_score, status, 0.5 AS match_score
         FROM applications ORDER BY ai_score DESC NULLS LAST LIMIT $1`,
        [limit]
      );
    }

    res.json({ candidates: result.rows, search_type: embedding ? 'semantic' : 'score_ranked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
