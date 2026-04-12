"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../database/db"));
const uuid_1 = require("uuid");
const powerAutomate_1 = require("../services/powerAutomate");
const router = (0, express_1.Router)();
// GET /api/applications - List all applications
router.get('/', (req, res) => {
    try {
        const { status, search, sort = 'created_at', order = 'desc', limit = '50', offset = '0' } = req.query;
        let query = 'SELECT * FROM applications WHERE 1=1';
        const params = [];
        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }
        if (search) {
            query += ' AND (full_name LIKE ? OR email LIKE ? OR position LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        // Count total
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const { total } = db_1.default.prepare(countQuery).get(...params);
        // Sort and paginate
        const allowedSorts = ['created_at', 'full_name', 'position', 'status', 'ai_score'];
        const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
        const applications = db_1.default.prepare(query).all(...params);
        res.json({
            applications,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    }
    catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});
// GET /api/applications/stats - Get application statistics
router.get('/stats', (_req, res) => {
    try {
        const stats = db_1.default.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'interviewed' THEN 1 ELSE 0 END) as interviewed,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(ai_score) as avg_ai_score
      FROM applications
    `).get();
        const recentActivity = db_1.default.prepare(`
      SELECT * FROM applications ORDER BY created_at DESC LIMIT 5
    `).all();
        const workflowStats = powerAutomate_1.PowerAutomateService.getWorkflowStats();
        res.json({ stats, recentActivity, workflowStats });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
// GET /api/applications/:id - Get single application
router.get('/:id', (req, res) => {
    try {
        const application = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        // Get workflow logs for this application
        const workflowLogs = db_1.default.prepare('SELECT * FROM workflow_logs WHERE application_id = ? ORDER BY created_at DESC').all(req.params.id);
        // Get follow-ups
        const followUps = db_1.default.prepare('SELECT * FROM follow_ups WHERE application_id = ? ORDER BY scheduled_date ASC').all(req.params.id);
        res.json({ application, workflowLogs, followUps });
    }
    catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});
// POST /api/applications - Create new application
router.post('/', async (req, res) => {
    try {
        const { full_name, email, phone, position, experience_years, cover_letter } = req.body;
        if (!full_name || !email || !position) {
            res.status(400).json({ error: 'Full name, email, and position are required' });
            return;
        }
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        db_1.default.prepare(`
      INSERT INTO applications (id, full_name, email, phone, position, experience_years, cover_letter, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, full_name, email, phone || null, position, experience_years || 0, cover_letter || null, now, now);
        // Update workflow status to triggered
        db_1.default.prepare('UPDATE applications SET workflow_status = ? WHERE id = ?').run('triggered', id);
        // Trigger Power Automate flow (async, don't block the response)
        const autoTrigger = db_1.default.prepare("SELECT value FROM settings WHERE key = 'auto_trigger_workflows'").get();
        if (autoTrigger?.value !== 'false') {
            powerAutomate_1.PowerAutomateService.triggerNewApplicationFlow({
                id,
                full_name,
                email,
                position,
                phone,
                created_at: now
            }).catch(err => console.error('Background flow trigger error:', err));
        }
        const application = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(id);
        res.status(201).json({ application, message: 'Application submitted successfully!' });
    }
    catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});
// PATCH /api/applications/:id/status - Update application status
router.patch('/:id/status', (req, res) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        const existing = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
        if (!existing) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        const updates = ['status = ?', 'updated_at = ?'];
        const params = [status, new Date().toISOString()];
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        params.push(req.params.id);
        db_1.default.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        const updated = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
        res.json({ application: updated, message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});
// DELETE /api/applications/:id - Delete application
router.delete('/:id', (req, res) => {
    try {
        const existing = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
        if (!existing) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        db_1.default.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
        res.json({ message: 'Application deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});
exports.default = router;
//# sourceMappingURL=applications.js.map