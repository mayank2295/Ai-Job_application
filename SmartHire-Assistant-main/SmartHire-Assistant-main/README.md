# 🚀 SmartHire Assistant – Candidate Engagement Chatbot

## 📌 Overview

**SmartHire Assistant** is an AI-powered candidate engagement system that interacts with job applicants using a Job Description (JD) as context.

It answers candidate questions, evaluates their suitability for the role, and captures their interest along with their resume.

---

## 🎯 Objectives

* Build a **text-based AI chatbot** using JD as context
* Capture **candidate interest + resume upload**
* Compute **Match Percentage** between candidate and JD
* Handle **uncertain queries gracefully**

---

## 🏗️ System Architecture

### 1. Frontend (React)

* Chat interface (like ChatGPT)
* “Interested?” button
* Resume upload (PDF)
* Display match %

### 2. Backend (Spring Boot / Node.js)

* API handling
* JD storage
* Resume processing
* Chat request handling

### 3. AI Layer (Claude / OpenAI)

* Prompt-based responses
* JD context injection
* Smart fallback handling

### 4. Database (MySQL / PostgreSQL)

* Candidate data
* Resume metadata
* Chat logs
* Match scores

---

## 🔄 Data Flow

1. Recruiter uploads Job Description (JD)
2. Candidate opens chatbot
3. JD is loaded as AI context
4. Candidate asks questions
5. AI responds based on JD
6. Candidate clicks **“Interested”**
7. Resume is uploaded
8. System extracts:

   * Skills
   * Experience
9. Match % is calculated
10. Data is stored in database

---

## 🧩 Core Features

### ✅ 1. Candidate Interest Capture

* “Interested?” button
* Resume upload (PDF)
* Store candidate details

---

### ✅ 2. AI Chatbot (Text-Based)

* Answers questions using JD context
* Covers:

  * Role details
  * Responsibilities
  * Skills required
  * Company info

---

### ✅ 3. Smart Q&A Handling

* If answer exists in JD → respond normally
* If NOT → fallback:

> "I’m not fully confident about that. I’ll connect you with a recruiter."

---

## 🧠 Prompt Design

```
You are a hiring assistant for Wissen Technology.

Job Description:
{JD_CONTENT}

Instructions:
- Answer only based on the JD
- Be professional and concise
- If unsure, say you will escalate

User Question:
{USER_INPUT}
```

---

## 📊 Match Percentage Logic

### Basic Formula:

```
Match % = (Matched Skills / Total JD Skills) * 100
```

### Improved Logic:

* Skills → 50%
* Experience → 30%
* Education → 20%

---

## 🛠️ Tech Stack

| Layer         | Technology               |
| ------------- | ------------------------ |
| Frontend      | React                    |
| Backend       | Spring Boot / Node.js    |
| AI API        | Claude / OpenAI          |
| Database      | MySQL / PostgreSQL       |
| Resume Parser | Python (PyMuPDF / spaCy) |

---

## 👥 Team Responsibilities

### Member 1 – Backend + AI

* API development
* AI integration
* Prompt engineering

### Member 2 – Frontend

* Chat UI
* Resume upload interface

### Member 3 – Python + ML

* Resume parsing
* Match % calculation

### Member 4 – Database + Integration

* DB design
* API integration
* Data storage

---

## ⚡ 2-Day Execution Plan

### 🗓️ Day 1

* Setup backend + frontend
* Store JD
* Build chatbot API
* Integrate AI

### 🗓️ Day 2

* Resume upload + parsing
* Match % calculation
* UI improvements
* End-to-end testing

---

## 🧪 Demo Flow (IMPORTANT)

1. Enter JD
2. Ask chatbot questions
3. Get accurate answers
4. Click “Interested”
5. Upload resume
6. Display Match %
7. Show stored data

---

## 📈 Evaluation Strategy

| Criteria     | Strategy              |
| ------------ | --------------------- |
| Architecture | Clear flow diagram    |
| Prompts      | Structured + fallback |
| Match %      | Logical calculation   |
| Demo         | End-to-end working    |
| API Usage    | Minimize calls        |
| Docs         | Clean README          |

---

## 🔥 Key Highlights

* JD-based contextual AI chatbot
* Resume-based candidate evaluation
* Smart fallback responses
* Scalable architecture

---

## 🚫 Common Mistakes to Avoid

* Random Match % (must be logical)
* Overcomplicated ML models
* No fallback for unknown queries
* Weak demo flow

---

## 🚀 Future Enhancements

* Recruiter dashboard
* Email notifications
* Chat history memory
* Candidate ranking system

---

## 🏁 Conclusion

SmartHire Assistant provides a scalable and intelligent solution for candidate engagement by combining AI-driven conversation, resume analysis, and job matching.

It enhances the hiring experience for both candidates and recruiters.

---
