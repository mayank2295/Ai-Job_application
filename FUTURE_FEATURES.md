# Future Feature Roadmap

These are potential high-impact features to elevate the platform into an enterprise-grade AI Hiring System.

### 1. 🎤 AI Mock Interview Simulator
**What it is:** An interactive feature where the AI plays the role of the hiring manager.
**How it works:** It reads the candidate's uploaded resume and the target job description, then asks tailored interview questions. The candidate can type (or use voice-to-text) their answers, and the AI will score their response and provide feedback on how to improve.

### 2. 📝 1-Click Cover Letter Generator
**What it is:** Automate the most tedious part of applying for jobs.
**How it works:** When a candidate clicks "Apply" on a job, the system automatically feeds their ATS-parsed resume and the Job Description into the LLM to instantly generate a highly tailored, professional cover letter that they can review and submit.

### 3. 📊 Kanban Application Tracker (Trello-style)
**What it is:** A visual pipeline for managing applications.
**How it works:**
- **For Admins:** A drag-and-drop board where they can move candidates between columns like *New*, *Reviewing*, *Interviewed*, and *Hired*.
- **For Candidates:** A visual tracker showing exactly where their application stands in the process.

### 4. 🧠 Automated Skill Assessments
**What it is:** AI-generated quizzes to validate candidate skills.
**How it works:** If a candidate claims they are an expert in "React" and "Python", the AI can instantly generate a quick 5-question multiple-choice quiz. If they pass, their application gets a "Verified Skill" badge for admins to see.

### 5. 📧 Direct Email/SMS Notifications
**What it is:** Keep users engaged with real-time updates.
**How it works:** While there is Power Automate for HR workflows, integrating **SendGrid** (for emails) or **Twilio** (for SMS) directly into the Node.js backend would allow candidates to automatically get an email when an admin changes their application status from "Pending" to "Reviewing".

### 6. 🌐 LinkedIn Profile Optimizer
**What it is:** Helping candidates improve their public brand.
**How it works:** The CareerBot could scan their uploaded resume and suggest exactly what they should write in their LinkedIn "Headline" and "About" sections to attract more recruiters based on current SEO trends.
