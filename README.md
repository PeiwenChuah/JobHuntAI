# JobHuntAI — Job Information Aggregator & AI Career Assistant

A modern, full-featured web application designed to help job seekers discover job postings with detailed company intelligence (such as **Company Origin Country**, **Company Size**, **Role Description**, **Salary**, and **Application Links**), generate **tailored cover letters**, and prepare for interviews with an **AI Interview Prep Coach**.

---

## 🌟 Key Features

1. **Job Information & Explorer**:
   - Search by job title (e.g., `Data Scientist`), company, skills, or keywords in real-time.
   - Transparent company intelligence for every listing:
     - **Company Origin Country / HQ** (with country flag badges)
     - **Company Size** (Mega-Corp 100k+, Enterprise 10k+, Mid-Market, Fast-growing Startups)
     - **Workplace Type** (Remote, Hybrid, On-site) & Location
     - **Salary Range** & Full Qualifications
     - **Direct Application Link** to official career pages.
   - Pre-loaded with comprehensive seed jobs across **Data Science, Machine Learning, AI Engineering, and Analytics** (Spotify, DeepL, Airbnb, Stripe, BioNTech, Shopee, Google, Canva, Wayve, Nubank, Nothing, Roche).
   - Multi-facet filtering: Filter by Origin Country, Company Size, Workplace Type, and Experience Level.
   - Interactive "+ Post / Add Job" form to add any custom job opportunities.

2. **AI Cover Letter Studio**:
   - Generates customized, high-converting cover letters combining the job's requirements, company scale/culture, and your candidate profile.
   - Customizable tones: **Professional**, **Enthusiastic**, **Confident**, or **Modern / Concise**.
   - Optional Strategic Focus Points input to emphasize specific projects (e.g., A/B testing, PyTorch, LLMs).
   - In-browser editor with one-click **Copy to Clipboard**, **Download as TXT**, and **Print / Save as PDF**.

3. **AI Interview Preparation Coach**:
   - **Technical Questions**: Custom questions based on role specialization (A/B testing, Transformer attention, Class imbalance, SQL window functions, Sensor fusion). Includes **Key Concepts to mention** and **Model Answers**.
   - **Behavioral Questions**: Structured around the **STAR Method** (Situation, Task, Action, Result) with step-by-step coaching blueprints.
   - **Company & Culture Questions**: Explores the company's origin country dynamics, enterprise scale, and strategic positioning.
   - **Reverse-Interview Questions**: Thoughtful, high-signal questions for candidates to ask the interviewer.
   - **Interactive Mock Simulator**: Type your answer to any question and receive instant AI feedback with:
     - Readiness Score (out of 100)
     - Key Strengths
     - Suggestions for Improvement
     - Polished Model Answer.

4. **Applications Tracker**:
   - Kanban board tracking applications across stages: **Bookmarked / Saved**, **Applied**, **Interviewing**, and **Offer / Decisions**.

5. **Profile & Resume Manager**:
   - Manage your candidate information, skills, experience, and links once; they are automatically populated whenever generating cover letters or prep notes.

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.8+ (Zero external dependencies needed! Runs using Python's standard library `http.server` and `sqlite3`).

### 2. Run the Application
Open your terminal in this directory and run:

```bash
python3 app.py
```

Then open your browser and navigate to:
```
http://localhost:8000
```

### 3. Optional: Live Gemini API Integration
The app works 100% out-of-the-box locally with its built-in synthesis engine. If you wish to use Google's live Gemini 1.5/2.0 API, simply set the environment variable before launching:

```bash
export GEMINI_API_KEY="your-gemini-api-key"
python3 app.py
```

---

## 📁 Project Structure

```
AI_Project/
├── app.py              # Lightweight HTTP web server & REST API router
├── database.py         # SQLite schema & rich initial job seed dataset
├── ai_engine.py        # Cover letter generation & interview prep coaching engine
├── jobs.db             # Local SQLite database (created on first run)
├── README.md           # Documentation & instructions
└── static/
    ├── index.html      # Modern semantic web layout & UI components
    ├── styles.css      # Responsive design system & badges
    └── app.js          # Interactive frontend client controller
```

