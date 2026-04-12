# Power Automate Setup Guide

## Overview

This guide walks you through setting up **3 Power Automate flows** that integrate with the Job Application Automation System. Your backend communicates with Power Automate via HTTP requests, and Power Automate calls back via webhooks.

## Architecture

```
Your App (Backend)  ──HTTP POST──►  Power Automate Flow
                                      │
                                      ├──► Send Email (Outlook)
                                      ├──► Post Message (Teams)
                                      ├──► AI Builder (Resume Analysis)
                                      │
Power Automate Flow ──HTTP POST──►  Your App (Webhook Endpoints)
```

---

## Flow 1: New Application Notification (Instant Flow)

**Type:** Instant Cloud Flow (HTTP Trigger)
**Trigger:** When your backend sends an HTTP POST after a new application is submitted

### Step-by-Step Setup

1. Go to [make.powerautomate.com](https://make.powerautomate.com)
2. Click **+ Create** → **Instant cloud flow**
3. Name it: "Job Application - New Application Notification"
4. Select trigger: **"When an HTTP request is received"**

### Configure the Trigger

Click "Use sample payload to generate schema" and paste:

```json
{
  "applicationId": "abc-123",
  "applicantName": "John Doe",
  "applicantEmail": "john@example.com",
  "position": "Software Engineer",
  "phone": "+1234567890",
  "appliedAt": "2024-01-15T10:30:00Z",
  "dashboardUrl": "http://localhost:5173/applications/abc-123"
}
```

### Add Action: Send Email (V2)

1. Click **+ New step** → Search "Outlook" → Select **"Send an email (V2)"**
2. Configure:
   - **To:** Use dynamic content `applicantEmail`
   - **Subject:** "Application Received - " + `position`
   - **Body:** (Use HTML)
   ```html
   <h2>Thank you for your application!</h2>
   <p>Dear <b>[applicantName]</b>,</p>
   <p>We have received your application for <b>[position]</b>.</p>
   <p>We will review your application and get back to you soon.</p>
   <p>Application ID: [applicationId]</p>
   ```

### Add Action: Post to Teams Channel

1. Click **+ New step** → Search "Teams" → Select **"Post message in a chat or channel"**
2. Configure:
   - **Post as:** Flow bot
   - **Post in:** Channel
   - **Team:** Select your team
   - **Channel:** Select an HR channel
   - **Message:**
   ```
   🆕 New Job Application!
   Applicant: [applicantName]
   Position: [position]
   Email: [applicantEmail]
   View: [dashboardUrl]
   ```

### Add Action: Response

1. Click **+ New step** → Search "Response" → Select **"Response"**
2. Status Code: `200`
3. Body: `{"status": "success", "message": "Notifications sent"}`

### Save and Copy URL

1. **Save** the flow
2. Go back to the trigger → Copy the **HTTP POST URL**
3. Paste it in your app's **Settings → Power Automate Flow URLs → New Application Flow URL**

---

## Flow 2: Resume Analysis (Automated/HTTP Trigger)

**Type:** Instant Cloud Flow (HTTP Trigger)
**Trigger:** When your backend sends resume data after upload

### Step-by-Step Setup

1. Create a new **Instant cloud flow**
2. Trigger: **"When an HTTP request is received"**
3. Name: "Job Application - Resume Analysis"

### Configure the Trigger Schema

```json
{
  "applicationId": "abc-123",
  "resumeFilename": "john-doe-resume.pdf",
  "resumeUrl": "https://<storage-account>.blob.core.windows.net/resumes/...",
  "applicantName": "John Doe",
  "position": "Software Engineer",
  "callbackUrl": "http://localhost:3001/api/webhooks/resume-analyzed"
}
```

### Add Action: AI Builder (Create text with GPT)

1. Click **+ New step** → Search "AI Builder" → Select **"Create text with GPT using a prompt"**
2. Create a prompt like:
   ```
   Analyze this resume for the position of [position].
   Applicant: [applicantName]
   
   Extract the following:
   1. A match score from 0-100
   2. A list of key skills
   3. A brief analysis summary
   
   Return as JSON:
   {"aiScore": 85, "skills": ["JavaScript", "React"], "analysis": "Strong candidate..."}
   ```

### Add Action: HTTP (Callback to your backend)

1. Click **+ New step** → Search "HTTP" → Select **"HTTP"**
2. Configure:
   - **Method:** POST
   - **URI:** Use dynamic content `callbackUrl`
   - **Headers:** `x-api-key: dev-secret-key-123`, `Content-Type: application/json`
   - **Body:** 
   ```json
   {
     "applicationId": "[applicationId from trigger]",
     "aiScore": [parsed score from AI],
     "skills": [parsed skills from AI],
     "analysis": "[parsed analysis from AI]"
   }
   ```

### Save and configure in your app

Copy the HTTP POST URL and paste it in **Settings → Resume Analysis Flow URL**

---

## Flow 3: Daily Follow-up Reminders (Scheduled Flow)

**Type:** Scheduled Cloud Flow
**Trigger:** Runs daily at 9:00 AM

### Step-by-Step Setup

1. Create a new **Scheduled cloud flow**
2. Name: "Job Application - Daily Follow-up Reminders"
3. Set recurrence: **Every 1 day** at **9:00 AM**

### Add Action: HTTP (Get pending applications)

1. Click **+ New step** → "HTTP"
2. Configure:
   - **Method:** GET
   - **URI:** `http://localhost:3001/api/webhooks/pending-followups`
   - **Headers:** `x-api-key: dev-secret-key-123`

### Add Action: Parse JSON

1. Click **+ New step** → "Parse JSON"
2. Content: Body from previous HTTP step
3. Schema:
```json
{
  "type": "object",
  "properties": {
    "count": {"type": "integer"},
    "applications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "full_name": {"type": "string"},
          "email": {"type": "string"},
          "position": {"type": "string"},
          "days_pending": {"type": "integer"}
        }
      }
    }
  }
}
```

### Add Condition: If count > 0

### Add Action: Apply to Each

For each pending application, send a reminder email:

1. **Send an email (V2)** to the HR notification email
2. Subject: "⏰ Follow-up Needed: [full_name] - [position]"
3. Body: "Application from [full_name] for [position] has been pending for [days_pending] days."

---

## Webhook API Reference

Your backend exposes these endpoints for Power Automate to call:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/webhooks/resume-analyzed` | POST | Receive AI analysis results | x-api-key header |
| `/api/webhooks/status-update` | POST | Update application status | x-api-key header |
| `/api/webhooks/pending-followups` | GET | Get pending applications | x-api-key header |

**API Key:** `dev-secret-key-123` (configurable in backend `.env`)

---

## Testing Without Power Automate

The system works fully without Power Automate configured. The workflows will log as "failed" with "Flow URL not configured" messages, but all CRUD operations work normally. This lets you:

1. Build and test the frontend/backend first
2. Add Power Automate flows when ready
3. Test the complete loop end-to-end

## Troubleshooting

- **"Flow URL not configured"** → Add the Power Automate URL in Settings
- **401 Unauthorized** → Check the `x-api-key` header matches your backend `.env`
- **Trigger not firing** → Ensure "Auto-trigger Workflows" is enabled in Settings
- **No callback received** → Check the callback URL is accessible (use ngrok for local dev)
