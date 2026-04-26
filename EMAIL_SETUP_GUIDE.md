# Email Notification Setup Guide

## Overview
Your project now uses **SendGrid** instead of n8n for email notifications. SendGrid is more reliable and has a generous free tier (100 emails/day).

## What's Implemented

### ✅ Candidate Emails (Already Working)
- **Welcome Email** - When user signs up
- **Status Update Email** - When application status changes (reviewing, shortlisted, interviewed, accepted, rejected)

### ✅ HR/Admin Emails (Just Added)
- **New Application Email** - When a candidate applies for a job
- **Status Change Email** - When application status is updated by admin

## Setup Instructions

### 1. Get SendGrid API Key (Free)

1. Go to [SendGrid](https://sendgrid.com/) and sign up (free tier: 100 emails/day)
2. Verify your email address
3. Go to Settings → API Keys → Create API Key
4. Give it "Full Access" permissions
5. Copy the API key (starts with `SG.`)

### 2. Verify Sender Email

1. In SendGrid dashboard, go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details (use your real email like `mayankgupta23081@gmail.com`)
4. Check your email and click the verification link
5. This email will be used as the "From" address

### 3. Update .env File

```env
# ─── SendGrid Email Service ───
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=mayankgupta23081@gmail.com
HR_NOTIFICATION_EMAIL=mayankgupta23081@gmail.com
```

**Important:**
- `SENDGRID_FROM_EMAIL` must be the verified email from step 2
- `HR_NOTIFICATION_EMAIL` is where HR notifications will be sent (can be same or different)

### 4. Restart Backend

```bash
cd backend
npm run dev
```

### 5. Update Render Environment Variables (Production)

1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment tab
4. Add these variables:
   - `SENDGRID_API_KEY` = your SendGrid API key
   - `SENDGRID_FROM_EMAIL` = your verified sender email
   - `HR_NOTIFICATION_EMAIL` = HR email address
5. Save and redeploy

## Email Triggers

### Candidate Receives Email When:
- ✅ Application status changes to: reviewing, shortlisted, interviewed, accepted, rejected
- ✅ They sign up for the first time (welcome email)

### HR Receives Email When:
- ✅ New application is submitted (includes candidate name, email, phone, position)
- ✅ Application status is changed (shows old status → new status)

## Testing

1. **Test New Application Email:**
   - Go to http://localhost:5173/jobs
   - Apply for a job
   - Check HR email inbox

2. **Test Status Change Email:**
   - Go to admin panel → Applications
   - Change an application status
   - Check both candidate and HR email inboxes

## Troubleshooting

### Emails Not Sending?

1. **Check backend logs** for errors like:
   ```
   sendNewApplicationEmailToHR failed: ...
   ```

2. **Verify SendGrid API key** is correct in `.env`

3. **Check SendGrid dashboard** → Activity → Email Activity to see delivery status

4. **Verify sender email** is authenticated in SendGrid

### Emails Going to Spam?

- Add SPF/DKIM records (SendGrid provides these in Sender Authentication)
- Use a custom domain instead of Gmail (optional, for production)

## Alternative: Use Settings Panel

You can also set the HR email from the Settings page in the admin panel:
1. Go to http://localhost:5173/settings
2. Update "Notification Email" field
3. This overrides the `HR_NOTIFICATION_EMAIL` from `.env`

## Cost

- **Free Tier:** 100 emails/day forever
- **Paid Plans:** Start at $15/month for 40,000 emails/month

For a hiring platform, the free tier should be sufficient for development and small-scale production.

## Next Steps

After setting up SendGrid:
1. Test all email flows
2. Customize email templates in `backend/src/services/emailService.ts`
3. Add more email types (interview scheduled, offer letter, etc.)
4. Consider adding email queue for high volume (using Bull + Redis)
