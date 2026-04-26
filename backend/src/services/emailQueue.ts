// Email queue using in-process retry logic (no Redis required for basic usage)
// Upgrade to BullMQ + Redis by setting REDIS_URL in .env and running: npm install bullmq ioredis nodemailer

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  type: 'application_received' | 'status_update' | 'interview_invite' | 'welcome';
}

// Simple in-memory queue with retry — swap for BullMQ when Redis is available
async function sendWithRetry(job: EmailJob, attempts = 3): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      if (!process.env.SMTP_USER) {
        console.log(`[EmailQueue] SMTP not configured, skipping ${job.type} to ${job.to}`);
        return;
      }
      // Dynamic require — install nodemailer when SMTP is needed: npm install nodemailer
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer') as any;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"JobFlow AI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: job.to,
        subject: job.subject,
        html: job.html,
      });
      console.log(`[EmailQueue] Sent ${job.type} to ${job.to}`);
      return;
    } catch (err: any) {
      console.error(`[EmailQueue] Attempt ${i + 1} failed:`, err.message);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  console.error(`[EmailQueue] All ${attempts} attempts failed for ${job.to}`);
}

export const emailTemplates = {
  applicationReceived: (candidateName: string, position: string, company: string) => ({
    subject: `Application received - ${position} at ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1">JobFlow AI</h2>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${position}</strong> at <strong>${company}</strong> has been received.</p>
        <p>We'll review your application and keep you updated on its status.</p>
        <p>Track your application: <a href="${process.env.FRONTEND_URL}/my-applications">My Applications</a></p>
        <hr/>
        <p style="color:#888;font-size:12px">JobFlow AI - Your AI-powered career companion</p>
      </div>
    `,
  }),

  statusUpdate: (candidateName: string, position: string, company: string, newStatus: string) => ({
    subject: `Application update - ${position} at ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1">JobFlow AI</h2>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${position}</strong> at <strong>${company}</strong> has been updated to:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <strong style="font-size:18px;text-transform:capitalize">${newStatus}</strong>
        </div>
        <p><a href="${process.env.FRONTEND_URL}/my-applications">View your application</a></p>
        <hr/>
        <p style="color:#888;font-size:12px">JobFlow AI</p>
      </div>
    `,
  }),
};

export async function sendEmail(emailData: EmailJob): Promise<void> {
  // Fire and forget — never block the request
  sendWithRetry(emailData).catch((err) =>
    console.error('[EmailQueue] Unhandled error:', err)
  );
}
