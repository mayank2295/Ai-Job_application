import { Router, Request, Response } from 'express';
import { all, get, query, run } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { PowerAutomateService } from '../services/powerAutomate';

const router = Router();

// GET /api/applications - List all applications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, sort = 'created_at', order = 'desc', limit = '50', offset = '0' } = req.query;
    const statusValue = Array.isArray(status) ? status[0] : status;
    const searchValue = Array.isArray(search) ? search[0] : search;

    let baseQuery = 'FROM applications WHERE 1=1';
    const params: any[] = [];

    if (statusValue && statusValue !== 'all') {
      params.push(statusValue);
      baseQuery += ` AND status = $${params.length}`;
    }

    if (searchValue) {
      const searchTerm = `%${searchValue}%`;
      const startIndex = params.length + 1;
      params.push(searchTerm, searchTerm, searchTerm);
      baseQuery += ` AND (full_name ILIKE $${startIndex} OR email ILIKE $${startIndex + 1} OR position ILIKE $${startIndex + 2})`;
    }

    // Count total
    const countRow = await get<{ total: string }>(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = Number(countRow?.total ?? 0);

    // Sort and paginate
    const allowedSorts = ['created_at', 'full_name', 'position', 'status', 'ai_score'];
    const sortCol = allowedSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const limitInput = Array.isArray(limit) ? limit[0] : limit;
    const offsetInput = Array.isArray(offset) ? offset[0] : offset;
    const limitValue = Number(limitInput) > 0 ? Number(limitInput) : 50;
    const offsetValue = Number(offsetInput) >= 0 ? Number(offsetInput) : 0;
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const dataQuery = `SELECT * ${baseQuery} ORDER BY ${sortCol} ${sortOrder} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const { rows: applications } = await query(dataQuery, [...params, limitValue, offsetValue]);

    res.json({
      applications,
      total,
      limit: limitValue,
      offset: offsetValue
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/stats - Get application statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'interviewed' THEN 1 ELSE 0 END) as interviewed,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(ai_score) as avg_ai_score
      FROM applications
    `);

    const recentActivity = await all(`
      SELECT * FROM applications ORDER BY created_at DESC LIMIT 5
    `);

    const workflowStats = await PowerAutomateService.getWorkflowStats();

    res.json({ stats, recentActivity, workflowStats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/applications/:id - Get single application
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const application = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Get workflow logs for this application
    const workflowLogs = await all(
      'SELECT * FROM workflow_logs WHERE application_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get follow-ups
    const followUps = await all(
      'SELECT * FROM follow_ups WHERE application_id = $1 ORDER BY scheduled_date ASC',
      [req.params.id]
    );

    res.json({ application, workflowLogs, followUps });
  } catch (error: any) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications - Create new application
router.post('/', async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, position, experience_years, cover_letter } = req.body;

    if (!full_name || !email || !position) {
      res.status(400).json({ error: 'Full name, email, and position are required' });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const insertResult = await query(`
      INSERT INTO applications (id, full_name, email, phone, position, experience_years, cover_letter, created_at, updated_at, workflow_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id,
      full_name,
      email,
      phone || null,
      position,
      experience_years || 0,
      cover_letter || null,
      now,
      now,
      'triggered'
    ]);

    const application = insertResult.rows[0];

    // Trigger Power Automate flow (async, don't block the response)
    const autoTrigger = await get<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'auto_trigger_workflows'"
    );
    
    if (autoTrigger?.value !== 'false') {
      PowerAutomateService.triggerNewApplicationFlow({
        id,
        full_name,
        email,
        position,
        phone,
        created_at: now
      }).catch(err => console.error('Background flow trigger error:', err));
    }

    res.status(201).json({ application, message: 'Application submitted successfully!' });
  } catch (error: any) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/applications/:id/status - Update application status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existing = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const params: any[] = [status, new Date().toISOString()];
    let updateClause = 'status = $1, updated_at = $2';

    if (notes !== undefined) {
      params.push(notes);
      updateClause += `, notes = $${params.length}`;
    }

    params.push(req.params.id);
    await run(`UPDATE applications SET ${updateClause} WHERE id = $${params.length}`, params);

    const updated = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    res.json({ application: updated, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    await run('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
