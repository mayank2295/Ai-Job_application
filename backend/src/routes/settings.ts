import { Router, Request, Response } from 'express';
import { all, transaction } from '../database/db';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const now = new Date().toISOString();

    await transaction(async (client) => {
      for (const [key, value] of Object.entries(updates)) {
        await client.query(
          `
          INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `,
          [key, String(value), now]
        );
      }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
