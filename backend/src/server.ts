import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './database/db';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// Import routes
import applicationRoutes from './routes/applications';
import resumeRoutes from './routes/resumes';
import webhookRoutes from './routes/webhooks';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded resumes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);

// Root message
app.get('/', (_req, res) => {
  res
    .status(200)
    .send('Job Application Automation API is running. See /api or /api/health.');
});

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
initializeDatabase();

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

export default app;
