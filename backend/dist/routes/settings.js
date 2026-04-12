"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../database/db"));
const router = (0, express_1.Router)();
// GET /api/settings - Get all settings
router.get('/', (_req, res) => {
    try {
        const settings = db_1.default.prepare('SELECT * FROM settings').all();
        const settingsMap = {};
        settings.forEach(s => { settingsMap[s.key] = s.value; });
        res.json(settingsMap);
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
// PUT /api/settings - Update settings
router.put('/', (req, res) => {
    try {
        const updates = req.body;
        const updateStmt = db_1.default.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
        const now = new Date().toISOString();
        const transaction = db_1.default.transaction(() => {
            for (const [key, value] of Object.entries(updates)) {
                updateStmt.run(key, String(value), now);
            }
        });
        transaction();
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map