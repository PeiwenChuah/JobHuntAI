# JobHuntAI — Real-Time Job Discovery & AI Career Assistant

A modern, high-performance web platform designed to help job seekers find real-time job postings worldwide (with strong support for **Malaysia, Singapore, US, UK, Germany**, etc.), discover transparent company intelligence (**Origin Country, Company Size, Workplace Type, Salary, Direct Application Links**), generate deeply personalized **AI Cover Letters**, and practice with an **AI Interview Prep Coach**.

---

## 🌐 Deploy to GitHub Pages (100% Free & Zero Server Required)

JobHuntAI features a **Universal Hybrid Architecture**: it runs **100% client-side** directly on **GitHub Pages** without requiring a Python server, while also seamlessly supporting a Python backend when running locally or in the cloud.

### 1-Click GitHub Pages Setup
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Enable GitHub Pages Universal Engine"
   git push origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** -> **Pages** (in the left sidebar).
   - Under **Build and deployment** -> **Source**:
     - **Option A (Recommended - GitHub Actions)**: Select **GitHub Actions**. The included `.github/workflows/deploy.yml` will automatically build and publish the site.
     - **Option B (Direct Branch)**: Select **Deploy from a branch** -> Branch: **`main`** -> Folder: **`/(root)`** -> Click **Save**.
3. Your live application will be published at:
   ```
   https://<username>.github.io/JobHuntAI/
   ```
   *(e.g. `https://peiwenchuah.github.io/JobHuntAI/`)*

### How GitHub Pages Mode Works:
- **Zero Server Setup**: All application state (Profile, Saved Jobs Tracker, Pipeline Stats) is persisted locally in your browser using `localStorage`.
- **Live Search & Gateways**: Fetches live tech/remote jobs via open CORS APIs (Remotive API) and provides verified 1-click search gateways for **LinkedIn**, **JobStreet Southeast Asia**, **Indeed**, and **Google Jobs**.
- **Ported AI Career Engines**: Personalized cover letter synthesis, STAR method interview coaching, and answer evaluation execute directly in browser JavaScript.
- **Optional Direct Gemini API**: You can paste your Gemini API key in the Cover Letter Studio for live multimodal LLM generation directly from your browser.
- **Optional Backend Connection**: Click the environment badge in the top-right corner to link a custom Python backend (e.g. deployed on Render/Railway) at any time.

---

## 💻 Local Development with Python Backend

You can also run the full Python backend locally with SQLite persistence and multi-source scrapers:

### 1. Requirements
- Python 3.8+ (Zero external dependencies required! Uses standard library `http.server`, `urllib`, and `sqlite3`).

### 2. Launch
```bash
python3 app.py
```
Open your browser at:
```
http://localhost:8000
```

### 3. Optional Gemini API Integration for Python
```bash
export GEMINI_API_KEY="your-gemini-api-key"
python3 app.py
```

---

## 🌟 Key Features

1. **Real-Time Live Job Discovery**:
   - **LinkedIn & JobStreet** live query integration.
   - **Multi-Country Tag Selector**: Search in Malaysia, Singapore, US, UK, Germany, or type any custom country.
   - **Time Filters**: Filter postings from Past 24 Hours, Past Week, Past Month, or Any Time.
   - **Source Filters**: Filter by LinkedIn, JobStreet, Remotive, Arbeitnow, or Web Gateways.
   - **Company Intelligence**: Company Origin Country (with country flag badges), Company Size (10,000+ Enterprise, Mid-Market, Startups), Workplace Type (Remote, Hybrid, On-site), and direct verified application links.

2. **Personalized Cover Letter Studio**:
   - Generates authentic, persuasive cover letters tailored to the candidate profile and specific role.
   - **Deep Customization Inputs**:
     - *Why This Company?* (Motivation & culture alignment)
     - *Key Quantified Achievements* (Metrics, scaled systems, impact)
     - *Skills to Emphasize*
     - *Career Story / Trajectory*
     - *Tone Selection*: Professional, Enthusiastic, Confident, Modern/Concise.
   - Export options: **Copy to Clipboard**, **Download as TXT**, and **Print / Save as PDF**.

3. **AI Interview Preparation Coach & Simulator**:
   - **Technical Questions**: Role-specific questions with key concepts to mention and model answers.
   - **Behavioral Questions**: Guided by the **STAR Method** (Situation, Task, Action, Result) with structured blueprints.
   - **Company Culture Questions**: Custom talking points aligned to employer scale and background.
   - **Reverse Questions**: High-signal questions for candidates to ask interviewers.
   - **Interactive Answer Evaluator**: Write your answer and receive real-time feedback with readiness score, identified strengths, missing STAR elements, and a polished model response.

4. **Visual Application Tracker (Kanban)**:
   - Organize and drag applications across stages: **Saved**, **Applied**, **Interviewing**, and **Offered**.
   - Automatic pipeline metrics and counters.

5. **Profile & Resume Manager**:
   - Centralized candidate profile storing contact info, career narrative, target titles, and skills that auto-populate all AI generators.

---

## 📁 Repository Structure

```
JobHuntAI/
├── index.html                  # Root entry point for GitHub Pages
├── app.js                      # Root client controller for GitHub Pages
├── styles.css                  # Root styling for GitHub Pages
├── app.py                      # Python backend server & REST API (CORS enabled)
├── job_fetcher.py              # Multi-source live scrapers (LinkedIn, JobStreet, Remotive)
├── ai_engine.py                # Python AI cover letter synthesizer & interview coach
├── database.py                 # SQLite database schema & migrations
├── static/                     # Assets for local Python app.py server
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions automated Pages deployment workflow
└── README.md                   # Documentation & deployment instructions
```

---

## 📄 License
MIT License. Created for job seekers and career accelerators worldwide.
