import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { initializeDatabase } from './database/db';
import { initSocketServer } from './services/socketService';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// Import routes
import applicationRoutes from './routes/applications';
import resumeRoutes from './routes/resumes';
import webhookRoutes from './routes/webhooks';
import settingsRoutes from './routes/settings';
import careerbotRoutes from './routes/careerbot';
import usersRoutes from './routes/users';
import jobsRoutes from './routes/jobs';
import aiFeaturesRoutes from './routes/aiFeatures';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';
import gdprRoutes from './routes/gdpr';
import billingRoutes from './routes/billing';
import searchRoutes from './routes/search';
import aiRoutes from './routes/ai';
import { generalLimiter, aiLimiter, authLimiter, heavyAILimiter } from './middleware/rateLimiter';

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

// Health routes (before rate limiter so they're never blocked)
app.use('/api/health', healthRoutes);

// Billing plans + status are lightweight reads — register before rate limiter
app.use('/api/billing', billingRoutes);

// Rate limiting
app.use('/api', generalLimiter);
app.use('/api/careerbot', aiLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/ai/cover-letter', heavyAILimiter);
app.use('/api/users/sync', authLimiter);

// API Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/careerbot', careerbotRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/ai', aiFeaturesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/search', searchRoutes);

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
initializeDatabase()
  .then(() => {
    const httpServer = createServer(app);
    initSocketServer(httpServer);
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════════════════');
      console.log(`   JobFlow AI API`);
      console.log(`   Server running on http://localhost:${PORT}`);
      console.log('   ───────────────────────────────────────────────────');
      console.log(`   💚 Health:    http://localhost:${PORT}/api/health`);
      console.log(`   📊 Detailed:  http://localhost:${PORT}/api/health/detailed`);
      console.log(`   🔌 WebSocket: enabled`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

export default app;
