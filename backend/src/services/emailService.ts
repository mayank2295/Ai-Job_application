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
