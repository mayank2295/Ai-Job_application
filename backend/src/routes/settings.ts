import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings
router.put('/', (req: Request, res: Response) => {
  try {
    const updates = req.body;

    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const now = new Date().toISOString();
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        updateStmt.run(key, String(value), now);
      }
    });

    transaction();
    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
