"""
Database management for JobHuntAI:
- Stores ONLY candidate profile, user-saved/bookmarked jobs, application statuses,
  generated cover letters, and interview prep notes.
- ZERO mock or invented jobs: All jobs in search are fetched 100% LIVE online from LinkedIn & web sources.
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jobs.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Saved / Tracked Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        company_country TEXT NOT NULL,
        company_size TEXT,
        company_industry TEXT,
        location TEXT NOT NULL,
        workplace_type TEXT,
        experience_level TEXT,
        salary_range TEXT,
        summary TEXT,
        description TEXT,
        responsibilities TEXT,
        requirements TEXT,
        skills TEXT,
        application_url TEXT NOT NULL UNIQUE,
        source TEXT DEFAULT 'LinkedIn',
        posted_at TEXT,
        status TEXT DEFAULT 'Saved', -- Saved, Applied, Interviewing, Offered, Rejected
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Candidate profile table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        current_title TEXT,
        years_experience INTEGER DEFAULT 3,
        skills TEXT,
        bio TEXT,
        education TEXT,
        portfolio_url TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Cover letters history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cover_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        job_title TEXT,
        company TEXT,
        content TEXT NOT NULL,
        tone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Interview prep history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_prep (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        job_title TEXT,
        company TEXT,
        prep_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Seed candidate profile if empty
    cursor.execute("SELECT COUNT(*) as count FROM profile")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO profile (id, full_name, email, phone, location, current_title, years_experience, skills, bio, education, linkedin_url, github_url)
        VALUES (
            1,
            'Alex Chen',
            'alex.chen@example.com',
            '+60 12-345 6789',
            'Kuala Lumpur, Malaysia (Open to Global Remote)',
            'Software Engineer & Data Professional',
            4,
            '["Python", "SQL", "Machine Learning", "FastAPI", "React", "Docker", "AWS", "Data Engineering"]',
            'Experienced professional with 4+ years building high-impact software and data applications across Southeast Asia and global companies.',
            'B.S. in Computer Science',
            'https://linkedin.com/in/alexchen',
            'https://github.com/alexchen'
        )
        """)

    conn.commit()
    conn.close()

def save_job(job_dict):
    """
    Saves a live job explicitly when the user clicks 'Save Job' or applies.
    """
    conn = get_db()
    cursor = conn.cursor()

    responsibilities = job_dict.get("responsibilities", "[]")
    if isinstance(responsibilities, list):
        responsibilities = json.dumps(responsibilities)

    requirements = job_dict.get("requirements", "[]")
    if isinstance(requirements, list):
        requirements = json.dumps(requirements)

    skills = job_dict.get("skills", "[]")
    if isinstance(skills, list):
        skills = json.dumps(skills)

    cursor.execute("""
    INSERT INTO saved_jobs (
        title, company, company_country, company_size, company_industry,
        location, workplace_type, experience_level, salary_range,
        summary, description, responsibilities, requirements, skills,
        application_url, source, posted_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(application_url) DO UPDATE SET
        title = excluded.title,
        company = excluded.company,
        status = excluded.status
    """, (
        job_dict.get("title", "Position"),
        job_dict.get("company", "Company"),
        job_dict.get("company_country", "Malaysia"),
        job_dict.get("company_size", "1,000 - 5,000 employees"),
        job_dict.get("company_industry", "Information Technology"),
        job_dict.get("location", "Malaysia"),
        job_dict.get("workplace_type", "Hybrid"),
        job_dict.get("experience_level", "Mid-level"),
        job_dict.get("salary_range", "Competitive Market Rate"),
        job_dict.get("summary", job_dict.get("description", "")[:160]),
        job_dict.get("description", ""),
        responsibilities,
        requirements,
        skills,
        job_dict.get("application_url"),
        job_dict.get("source", "LinkedIn"),
        job_dict.get("posted_at", ""),
        job_dict.get("status", "Saved")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def delete_saved_job(job_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()

def get_saved_jobs(status=None):
    conn = get_db()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM saved_jobs WHERE status = ? ORDER BY id DESC", (status,))
    else:
        cursor.execute("SELECT * FROM saved_jobs ORDER BY id DESC")
    rows = cursor.fetchall()
    jobs = []
    for r in rows:
        j = dict(r)
        try:
            j["skills"] = json.loads(j.get("skills") or "[]")
        except Exception:
            j["skills"] = []
        jobs.append(j)
    conn.close()
    return jobs

def get_saved_job_by_id(job_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    j = dict(row)
    for f in ["responsibilities", "requirements", "skills"]:
        try:
            j[f] = json.loads(j.get(f) or "[]")
        except Exception:
            j[f] = []
    return j
