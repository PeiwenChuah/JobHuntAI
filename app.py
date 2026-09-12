"""
JobHuntAI Web Server:
Zero-dependency HTTP server delivering:
- Static assets (HTML, CSS, JS)
- 100% LIVE on-demand job search querying LinkedIn and JobStreet in real-time
- No mock/invented jobs stored: database is used ONLY for user-saved jobs, profile, and applications
- Cover Letter Studio and Interview Preparation Coach
"""

import http.server
import json
import os
import urllib.parse
import mimetypes
from datetime import datetime
import database
import ai_engine
import job_fetcher

PORT = int(os.environ.get("PORT", 8000))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

class JobHuntRequestHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len > 0:
                raw_data = self.rfile.read(content_len).decode("utf-8")
                return json.loads(raw_data)
        except Exception as e:
            print(f"Error reading JSON body: {e}")
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/jobs/live-search":
            self.handle_live_search(query)
        elif path == "/api/jobs/saved":
            self.handle_get_saved_jobs(query)
        elif path.startswith("/api/jobs/saved/"):
            job_id_part = path[len("/api/jobs/saved/"):]
            if job_id_part.isdigit():
                self.handle_get_saved_job_detail(int(job_id_part))
            else:
                self.send_error(404, "Invalid Job ID")
        elif path == "/api/profile":
            self.handle_get_profile()
        elif path == "/api/stats":
            self.handle_get_stats()
        elif path == "/api/cover-letters":
            self.handle_get_cover_letters()
        else:
            self.serve_static(path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/jobs/save":
            self.handle_save_job()
        elif path == "/api/profile":
            self.handle_update_profile()
        elif path == "/api/cover-letter/generate":
            self.handle_generate_cover_letter()
        elif path == "/api/interview/prep":
            self.handle_generate_interview_prep()
        elif path == "/api/interview/evaluate":
            self.handle_evaluate_interview_answer()
        else:
            self.send_error(404, "Endpoint not found")

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/jobs/saved/") and path.endswith("/status"):
            parts = path.split("/")
            try:
                job_id = int(parts[4])
                self.handle_update_saved_job_status(job_id)
            except Exception:
                self.send_error(400, "Invalid Job ID")
        else:
            self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/jobs/saved/"):
            parts = path.split("/")
            try:
                job_id = int(parts[4])
                database.delete_saved_job(job_id)
                self.send_json({"message": "Job removed from saved jobs"})
            except Exception as e:
                self.send_error(400, f"Error deleting job: {e}")
        else:
            self.send_error(404, "Endpoint not found")

    # --- Live Search Handler ---

    def handle_live_search(self, query):
        """
        Executes pure real-time live search for any role in any country.
        Zero mock/invented jobs.
        """
        try:
            q = query.get("q", [""])[0].strip()
            country_str = query.get("countries", [""])[0].strip() or query.get("country", [""])[0].strip()
            time_filter = query.get("time", ["any"])[0].strip().lower()
            company_size = query.get("size", [""])[0].strip()
            workplace = query.get("workplace", [""])[0].strip()
            experience = query.get("experience", [""])[0].strip()

            source_filter = query.get("source", [""])[0].strip()

            if not q:
                self.send_json({"jobs": [], "total": 0, "message": "Please enter a job title to search"})
                return

            countries = [c.strip() for c in country_str.split(",") if c.strip()] if country_str else ["Malaysia"]

            print(f"[LIVE SEARCH REQUEST] Query: '{q}' | Countries: {countries} | Time: {time_filter} | Source: {source_filter}")
            live_jobs = job_fetcher.search_live_jobs(query=q, countries=countries, time_filter=time_filter, source_filter=source_filter)

            # In-memory post-filtering for workplace, size, experience, source if user selected them
            filtered = []
            for j in live_jobs:
                if source_filter and source_filter.lower() not in (j.get("source") or "").lower():
                    continue
                if company_size and company_size not in (j.get("company_size") or ""):
                    continue
                if workplace:
                    wp_val = (j.get("workplace_type") or "").lower()
                    loc_val = (j.get("location") or "").lower()
                    title_val = (j.get("title") or "").lower()
                    w_req = workplace.lower()
                    if w_req == "remote" and not ("remote" in wp_val or "remote" in loc_val or "remote" in title_val or "various" in wp_val):
                        continue
                    elif w_req == "hybrid" and not ("hybrid" in wp_val or "hybrid" in loc_val or "hybrid" in title_val or "various" in wp_val):
                        continue
                    elif w_req in ("on-site", "onsite") and not ("on-site" in wp_val or "onsite" in wp_val or "office" in wp_val or "various" in wp_val or (not "remote" in wp_val and not "hybrid" in wp_val)):
                        continue
                if experience:
                    exp_val = (j.get("experience_level") or "").lower()
                    title_val = (j.get("title") or "").lower()
                    e_req = experience.lower()
                    if "entry" in e_req and not any(k in exp_val or k in title_val for k in ["entry", "junior", "intern", "graduate", "trainee", "associate", "all levels"]):
                        continue
                    elif "mid" in e_req and not any(k in exp_val or k in title_val for k in ["mid", "intermediate", "all levels"]):
                        continue
                    elif "senior" in e_req and not any(k in exp_val or k in title_val for k in ["senior", "sr", "principal", "staff", "all levels"]):
                        continue
                    elif "lead" in e_req and not any(k in exp_val or k in title_val for k in ["lead", "head", "manager", "director", "vp", "chief", "all levels"]):
                        continue
                filtered.append(j)

            # Check which of these are already saved by the user
            try:
                saved_urls = set(sj.get("application_url") for sj in database.get_saved_jobs())
                for j in filtered:
                    j["is_saved"] = j.get("application_url") in saved_urls
            except Exception as db_e:
                print(f"[Warning] Could not check saved status: {db_e}")

            print(f"[LIVE SEARCH RESULT] Returned {len(filtered)} verified real jobs.")
            self.send_json({"jobs": filtered, "total": len(filtered), "query": q, "countries": countries})
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json({"jobs": [], "total": 0, "error": str(e), "message": "Failed to fetch live jobs. Please try again."})

    # --- Saved Jobs Handlers ---

    def handle_save_job(self):
        data = self.read_json_body()
        if not data.get("application_url"):
            self.send_json({"error": "Missing application URL"}, status=400)
            return

        new_id = database.save_job(data)
        self.send_json({"message": "Job saved to your tracker successfully!", "id": new_id}, status=201)

    def handle_get_saved_jobs(self, query):
        status = query.get("status", [""])[0].strip()
        jobs = database.get_saved_jobs(status=status if status else None)
        self.send_json({"jobs": jobs, "total": len(jobs)})

    def handle_get_saved_job_detail(self, job_id):
        job = database.get_saved_job_by_id(job_id)
        if not job:
            self.send_json({"error": "Saved job not found"}, status=404)
            return
        self.send_json(job)

    def handle_update_saved_job_status(self, job_id):
        data = self.read_json_body()
        new_status = data.get("status")
        if not new_status:
            self.send_json({"error": "Status is required"}, status=400)
            return

        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE saved_jobs SET status = ? WHERE id = ?", (new_status, job_id))
        conn.commit()
        conn.close()

        self.send_json({"message": f"Saved job status updated to {new_status}"})

    # --- Profile & Stats Handlers ---

    def handle_get_profile(self):
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profile WHERE id = 1")
        row = cursor.fetchone()
        conn.close()

        if row:
            p = dict(row)
            try:
                p["skills"] = json.loads(p.get("skills") or "[]")
            except Exception:
                p["skills"] = []
            self.send_json(p)
        else:
            self.send_json({})

    def handle_update_profile(self):
        data = self.read_json_body()
        skills = json.dumps(data.get("skills", [])) if isinstance(data.get("skills"), list) else data.get("skills", "[]")

        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE profile SET
            full_name = ?,
            email = ?,
            phone = ?,
            location = ?,
            current_title = ?,
            years_experience = ?,
            skills = ?,
            bio = ?,
            education = ?,
            portfolio_url = ?,
            linkedin_url = ?,
            github_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """, (
            data.get("full_name"),
            data.get("email"),
            data.get("phone"),
            data.get("location"),
            data.get("current_title"),
            data.get("years_experience", 3),
            skills,
            data.get("bio"),
            data.get("education"),
            data.get("portfolio_url"),
            data.get("linkedin_url"),
            data.get("github_url")
        ))
        conn.commit()
        conn.close()

        self.send_json({"message": "Profile updated successfully"})

    def handle_get_stats(self):
        conn = database.get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as saved FROM saved_jobs WHERE status = 'Saved'")
        saved = cursor.fetchone()["saved"]

        cursor.execute("SELECT COUNT(*) as applied FROM saved_jobs WHERE status = 'Applied'")
        applied = cursor.fetchone()["applied"]

        cursor.execute("SELECT COUNT(*) as interviewing FROM saved_jobs WHERE status = 'Interviewing'")
        interviewing = cursor.fetchone()["interviewing"]

        cursor.execute("SELECT COUNT(*) as total FROM saved_jobs")
        total_saved = cursor.fetchone()["total"]

        conn.close()
        self.send_json({
            "saved": saved,
            "applied": applied,
            "interviewing": interviewing,
            "total_saved": total_saved
        })

    # --- Cover Letter & Interview Prep ---

    def handle_generate_cover_letter(self):
        data = self.read_json_body()
        job_id = data.get("job_id")
        tone = data.get("tone", "professional")
        focus_points = data.get("focus_points", "")
        optional_info = data.get("optional_info", {})

        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profile WHERE id = 1")
        prof_row = cursor.fetchone()
        profile = dict(prof_row) if prof_row else {}
        conn.close()

        if job_id:
            job = database.get_saved_job_by_id(job_id)
        else:
            job = data.get("custom_job", {})

        if not job:
            self.send_json({"error": "Job information missing"}, status=400)
            return

        if data.get("profile_override"):
            profile.update(data["profile_override"])

        letter = ai_engine.generate_cover_letter(job, profile, tone, focus_points)
        letter = ai_engine.generate_cover_letter(job, profile, tone, focus_points, optional_info)

        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO cover_letters (job_id, job_title, company, content, tone)
        VALUES (?, ?, ?, ?, ?)
        """, (job.get("id"), job.get("title", ""), job.get("company", ""), letter, tone))
        conn.commit()
        conn.close()

        self.send_json({"cover_letter": letter, "tone": tone})

    def handle_get_cover_letters(self):
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cover_letters ORDER BY id DESC LIMIT 20")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        self.send_json({"cover_letters": rows})

    def handle_generate_interview_prep(self):
        data = self.read_json_body()
        job_id = data.get("job_id")

        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profile WHERE id = 1")
        prof_row = cursor.fetchone()
        profile = dict(prof_row) if prof_row else {}
        conn.close()

        if job_id:
            job = database.get_saved_job_by_id(job_id)
        else:
            job = data.get("custom_job", {})

        if not job:
            self.send_json({"error": "Job information missing"}, status=400)
            return

        prep_data = ai_engine.generate_interview_prep(job, profile)
        self.send_json(prep_data)

    def handle_evaluate_interview_answer(self):
        data = self.read_json_body()
        q_id = data.get("question_id", "q")
        q_text = data.get("question_text", "")
        user_answer = data.get("user_answer", "")
        job_id = data.get("job_id")
        job = data.get("custom_job") or {}
        if job_id and not job:
            job = database.get_saved_job_by_id(job_id) or {}

        result = ai_engine.evaluate_interview_answer(q_id, q_text, user_answer, job)
        self.send_json(result)

    def serve_static(self, path):
        if path in ["", "/"]:
            path = "/index.html"

        rel_path = path.lstrip("/")
        full_path = os.path.normpath(os.path.join(STATIC_DIR, rel_path))

        if not full_path.startswith(STATIC_DIR) or not os.path.exists(full_path) or os.path.isdir(full_path):
            self.send_error(404, "File Not Found")
            return

        mime_type, _ = mimetypes.guess_type(full_path)
        if mime_type is None:
            mime_type = "application/octet-stream"

        try:
            with open(full_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", f"{mime_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {e}")

def run_server():
    database.init_db()
    server_address = ("", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, JobHuntRequestHandler)
    print(f"==================================================")
    print(f"  JobHuntAI Live Server running at http://localhost:{PORT}")
    print(f"  Live Real-time Search Engine Active (LinkedIn & JobStreet)")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
