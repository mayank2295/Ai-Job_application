"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./database/db");
// Load environment variables
dotenv_1.default.config();
// Import routes
const applications_1 = __importDefault(require("./routes/applications"));
const resumes_1 = __importDefault(require("./routes/resumes"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const settings_1 = __importDefault(require("./routes/settings"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Static file serving for uploaded resumes
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// API Routes
app.use('/api/applications', applications_1.default);
app.use('/api/resumes', resumes_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/ai', ai_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'Job Application Automation API'
    });
});
// API info endpoint
app.get('/api', (_req, res) => {
    res.json({
        name: 'Job Application Automation API',
        version: '1.0.0',
        endpoints: {
            applications: '/api/applications',
            resumes: '/api/resumes',
            webhooks: '/api/webhooks',
            settings: '/api/settings',
            health: '/api/health'
        },
        powerAutomate: {
            webhookCallback: `http://localhost:${PORT}/api/webhooks/resume-analyzed`,
            pendingFollowups: `http://localhost:${PORT}/api/webhooks/pending-followups`,
            statusUpdate: `http://localhost:${PORT}/api/webhooks/status-update`
        }
    });
});
// Initialize database and start server
(0, db_1.initializeDatabase)();
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ═══════════════════════════════════════════════════');
    console.log(`   Job Application Automation API`);
    console.log(`   Server running on http://localhost:${PORT}`);
    console.log('   ───────────────────────────────────────────────────');
    console.log(`   📋 API Docs:     http://localhost:${PORT}/api`);
    console.log(`   💚 Health:       http://localhost:${PORT}/api/health`);
    console.log(`   🔗 Webhook URL:  http://localhost:${PORT}/api/webhooks/`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
});
exports.default = app;
//# sourceMappingURL=server.js.map