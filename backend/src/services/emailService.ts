import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const STATUS_MESSAGES: Record<string, string> = {
  reviewing: 'A recruiter is now reviewing your application.',
  interviewed: "You've been shortlisted. Watch for interview scheduling details.",
  accepted: 'Congratulations! Your application has been accepted.',
  rejected: 'Thank you for applying. You were not selected for this role.',
};

function baseTemplate(title: string, subtitle: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, sans-serif; background: #f5f7ff; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e7eaf7;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #eef1fb;">
        <h2 style="margin: 0; color: #3730a3;">JobFlow AI</h2>
        <p style="margin: 6px 0 0; color: #64748b;">${subtitle}</p>
      </div>
      <div style="padding: 24px;">
        <h3 style="margin-top: 0; color: #0f172a;">${title}</h3>
        ${bodyHtml}
      </div>
    </div>
  </div>
  `;
}

export async function sendStatusUpdateEmail(
  to: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string
): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;

  try {
    const statusText = STATUS_MESSAGES[newStatus] || `Your application status is now "${newStatus}".`;
    const html = baseTemplate(
      'Application Status Updated',
      'Your job application progress update',
      `
      <p style="color:#334155;">Hi ${candidateName || 'Candidate'},</p>
      <p style="color:#334155;">Your application for <strong>${jobTitle}</strong> has moved to:</p>
      <div style="display:inline-block; background:#eef2ff; color:#4338ca; border-radius:999px; padding:6px 12px; font-weight:700; text-transform:capitalize; margin-bottom:12px;">${newStatus}</div>
      <p style="color:#334155;">${statusText}</p>
      <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/my-applications" style="display:inline-block; margin-top:10px; padding:10px 14px; border-radius:8px; text-decoration:none; background:#4f46e5; color:#fff;">View My Applications</a>
      `
    );

    await sgMail.send({
      to,
      from: SENDGRID_FROM_EMAIL,
      subject: `JobFlow AI: ${jobTitle} application update`,
      html,
    });
  } catch (error) {
    console.error('sendStatusUpdateEmail failed:', error);
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;

  try {
    const html = baseTemplate(
      'Welcome to JobFlow AI',
      'Your career acceleration platform',
      `
      <p style="color:#334155;">Hi ${name || 'there'},</p>
      <p style="color:#334155;">Welcome to JobFlow AI. Your profile is ready, and you can start exploring roles, applying with smart insights, and tracking your progress.</p>
      <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/jobs" style="display:inline-block; margin-top:10px; padding:10px 14px; border-radius:8px; text-decoration:none; background:#4f46e5; color:#fff;">Browse Jobs</a>
      `
    );

    await sgMail.send({
      to,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Welcome to JobFlow AI',
      html,
    });
  } catch (error) {
    console.error('sendWelcomeEmail failed:', error);
  }
}

export async function sendNewApplicationEmailToHR(
  hrEmail: string,
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  applicationId: string,
  phone?: string
): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !hrEmail) return;

  try {
    const html = baseTemplate(
      'New Application Received',
      'A candidate has applied for a position',
      `
      <p style="color:#334155;">Hi HR Team,</p>
      <p style="color:#334155;">A new application has been submitted:</p>
      <div style="background:#f8fafc; border-left:3px solid #4f46e5; padding:12px 16px; margin:16px 0;">
        <p style="margin:4px 0; color:#334155;"><strong>Candidate:</strong> ${candidateName}</p>
        <p style="margin:4px 0; color:#334155;"><strong>Email:</strong> ${candidateEmail}</p>
        ${phone ? `<p style="margin:4px 0; color:#334155;"><strong>Phone:</strong> ${phone}</p>` : ''}
        <p style="margin:4px 0; color:#334155;"><strong>Position:</strong> ${jobTitle}</p>
      </div>
      <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/applications/${applicationId}" style="display:inline-block; margin-top:10px; padding:10px 14px; border-radius:8px; text-decoration:none; background:#4f46e5; color:#fff;">View Application</a>
      `
    );

    await sgMail.send({
      to: hrEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `New Application: ${candidateName} for ${jobTitle}`,
      html,
    });
    console.log(`✅ New application email sent to HR: ${hrEmail}`);
  } catch (error) {
    console.error('sendNewApplicationEmailToHR failed:', error);
  }
}

export async function sendStatusChangeEmailToHR(
  hrEmail: string,
  candidateName: string,
  jobTitle: string,
  oldStatus: string,
  newStatus: string,
  applicationId: string
): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !hrEmail) return;

  try {
    const statusColors: Record<string, string> = {
      pending: '#94a3b8',
      reviewing: '#3b82f6',
      shortlisted: '#8b5cf6',
      interviewed: '#f59e0b',
      accepted: '#10b981',
      rejected: '#ef4444',
    };

    const html = baseTemplate(
      'Application Status Updated',
      'An application status has changed',
      `
      <p style="color:#334155;">Hi HR Team,</p>
      <p style="color:#334155;">Application status has been updated:</p>
      <div style="background:#f8fafc; border-left:3px solid #4f46e5; padding:12px 16px; margin:16px 0;">
        <p style="margin:4px 0; color:#334155;"><strong>Candidate:</strong> ${candidateName}</p>
        <p style="margin:4px 0; color:#334155;"><strong>Position:</strong> ${jobTitle}</p>
        <p style="margin:8px 0 4px; color:#334155;"><strong>Status Change:</strong></p>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="background:${statusColors[oldStatus] || '#94a3b8'}; color:#fff; padding:4px 10px; border-radius:999px; font-size:12px; text-transform:capitalize;">${oldStatus}</span>
          <span style="color:#64748b;">→</span>
          <span style="background:${statusColors[newStatus] || '#94a3b8'}; color:#fff; padding:4px 10px; border-radius:999px; font-size:12px; text-transform:capitalize;">${newStatus}</span>
        </div>
      </div>
      <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/applications/${applicationId}" style="display:inline-block; margin-top:10px; padding:10px 14px; border-radius:8px; text-decoration:none; background:#4f46e5; color:#fff;">View Application</a>
      `
    );

    await sgMail.send({
      to: hrEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `Status Update: ${candidateName} - ${jobTitle} (${newStatus})`,
      html,
    });
    console.log(`✅ Status change email sent to HR: ${hrEmail}`);
  } catch (error) {
    console.error('sendStatusChangeEmailToHR failed:', error);
  }
}
