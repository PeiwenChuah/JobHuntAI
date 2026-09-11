"""
AI Career Engine for JobHuntAI:
- Generates tailored cover letters based on candidate profile and job specifics.
- Generates job-specific interview questions (Technical, Behavioral, Situational).
- Provides STAR method coaching and evaluates practice interview answers.
- Zero external package dependency: supports built-in smart synthesis and optional Gemini API integration.
"""

import json
import os
import re
import urllib.request
import urllib.error

def generate_cover_letter(job, profile, tone="professional", focus_points="", optional_info=None):
    """
    Generates a personalized cover letter combining job requirements,
    company culture/size/origin, candidate profile, and rich optional candidate details
    (motivation, achievements, metrics, career story, highlighted skills).
    """
    if optional_info is None:
        optional_info = {}

    api_key = optional_info.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            return call_gemini_cover_letter(job, profile, tone, focus_points, optional_info, api_key)
        except Exception as e:
            print(f"[Gemini API fallback] Error: {e}, falling back to personalized synthesizer.")

    return synthesize_personalized_cover_letter(job, profile, tone, focus_points, optional_info)


def synthesize_personalized_cover_letter(job, profile, tone="professional", focus_points="", optional_info=None):
    """
    Dynamic, deeply personalized cover letter engine.
    Crafts unique narrative paragraphs around candidate achievements, metrics, company motivation,
    and career trajectory without rigid template phrases.
    """
    if optional_info is None:
        optional_info = {}

    # Candidate Profile
    name = profile.get("full_name") or "Applicant"
    email = profile.get("email") or "applicant@example.com"
    phone = profile.get("phone") or ""
    location = profile.get("location") or ""
    current_title = profile.get("current_title") or "Professional"
    years_exp = profile.get("years_experience") or 3
    bio = profile.get("bio") or ""
    education = profile.get("education") or ""

    # Parse candidate skills
    raw_skills = profile.get("skills") or "[]"
    if isinstance(raw_skills, str):
        try:
            candidate_skills = json.loads(raw_skills)
        except Exception:
            candidate_skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
    else:
        candidate_skills = raw_skills if isinstance(raw_skills, list) else []

    # Job Details
    job_title = job.get("title", "the target position")
    company = job.get("company", "your organization")
    company_country = job.get("company_country", "")
    company_size = job.get("company_size", "")
    company_industry = job.get("company_industry", "your industry")
    summary = job.get("summary", "")

    raw_reqs = job.get("requirements", "[]")
    if isinstance(raw_reqs, str):
        try:
            requirements = json.loads(raw_reqs)
        except Exception:
            requirements = [r.strip() for r in raw_reqs.split("\n") if r.strip()]
    else:
        requirements = raw_reqs if isinstance(raw_reqs, list) else []

    raw_skills_req = job.get("skills", "[]")
    if isinstance(raw_skills_req, str):
        try:
            job_skills = json.loads(raw_skills_req)
        except Exception:
            job_skills = [s.strip() for s in raw_skills_req.split(",") if s.strip()]
    else:
        job_skills = raw_skills_req if isinstance(raw_skills_req, list) else []

    # Optional candidate custom inputs
    motivation = (optional_info.get("motivation") or "").strip()
    achievements = (optional_info.get("achievements") or "").strip()
    skills_highlight = (optional_info.get("skills_highlight") or "").strip()
    career_story = (optional_info.get("career_story") or "").strip()
    custom_focus = (focus_points or optional_info.get("focus_points") or "").strip()

    # Determine skills to feature
    if skills_highlight:
        featured_skills = [s.strip() for s in skills_highlight.split(",") if s.strip()]
    else:
        matched = [s for s in candidate_skills if any(s.lower() in js.lower() or js.lower() in s.lower() for js in job_skills)]
        featured_skills = matched[:4] if matched else candidate_skills[:4]
    
    skills_str = ", ".join(featured_skills) if featured_skills else "specialized analytical and problem-solving methodologies"

    # Tone adjustments
    tone = (tone or "professional").lower()

    # --- 1. Salutation ---
    if tone == "modern":
        salutation = f"Hello {company} Team,"
    elif tone == "confident":
        salutation = f"Dear Hiring Team for {job_title},"
    elif tone == "enthusiastic":
        salutation = f"Dear {company} Hiring Team,"
    else:
        salutation = f"Dear Hiring Manager at {company},"

    # --- 2. Opening Hook & Motivation ---
    # Weave motivation seamlessly if provided
    country_mention = f" originated in {company_country}" if company_country and company_country.lower() not in ["global", "various"] else ""
    
    if motivation:
        if tone == "enthusiastic":
            p1 = f"I am genuinely excited to apply for the {job_title} position at {company}. {motivation}"
        elif tone == "confident":
            p1 = f"I am writing to express my strong interest in the {job_title} role at {company}. {motivation}"
        elif tone == "modern":
            p1 = f"I am writing to apply for {company}'s {job_title} role. {motivation}"
        else: # professional
            p1 = f"Please accept this application for the {job_title} position at {company}. {motivation}"
    else:
        if tone == "enthusiastic":
            p1 = f"I was thrilled to discover the opening for the {job_title} role at {company}. With {company}'s distinguished presence in {company_industry}{country_mention}, the opportunity to contribute my expertise as a {current_title} directly aligns with my passion for high-impact innovation."
        elif tone == "confident":
            p1 = f"I am writing to present my candidacy for the {job_title} role at {company}. With a track record of driving technical execution and operational rigor in {company_industry}, I am confident in my ability to make an immediate, measurable impact on your team."
        elif tone == "modern":
            p1 = f"I am excited to apply for the {job_title} role at {company}. As a {current_title} with over {years_exp} years specializing in {skills_str}, I focus on turning complex challenges into scalable, high-performance solutions."
        else: # professional
            p1 = f"Please accept this letter as an expression of my serious interest in the {job_title} role at {company}. With {company}'s strong standing in {company_industry}{country_mention}, this position represents an ideal match for my technical background and strategic problem-solving experience."

    # --- 3. Key Achievements & Measurable Metrics ---
    # This is the centerpiece for personalization
    if achievements:
        # Split achievements into distinct statements if multiple
        ach_items = [a.strip() for a in re.split(r'[;\n]+', achievements) if a.strip()]
        if len(ach_items) == 1:
            ach_text = f"A defining example of this impact includes: {ach_items[0].rstrip('.')}."
        elif len(ach_items) == 2:
            ach_text = f"Key milestones from my recent work include: {ach_items[0].rstrip('.')}; additionally, I {ach_items[1].lstrip('I ').rstrip('.')}."
        else:
            first_part = "; ".join(a.rstrip('.') for a in ach_items[:-1])
            last_item = ach_items[-1].lstrip('I ').rstrip('.')
            ach_text = f"Key milestones from my background include: {first_part}; and notably, I {last_item}."

        if tone == "confident":
            p2 = f"Throughout my {years_exp}+ years as a {current_title}, I have prioritized tangible business metrics over routine execution. {ach_text} By combining structured execution with technical mastery in {skills_str}, I ensure that engineering and operational efforts translate directly into business leverage."
        elif tone == "modern":
            p2 = f"In my day-to-day work, I focus on delivering concrete results rather than just completing tasks. {ach_text} My toolkit is centered on {skills_str}, allowing me to move quickly from exploratory analysis to robust, production-grade systems."
        elif tone == "enthusiastic":
            p2 = f"What drives me every day is seeing technical initiatives translate into transformative real-world outcomes. {ach_text} Applying competencies across {skills_str}, I take pride in collaborating cross-functionally and tackling demanding problem domains."
        else: # professional
            p2 = f"Over the course of my {years_exp}+ years of experience as a {current_title}, I have consistently focused on delivering measurable, high-value outcomes. {ach_text} This experience has reinforced my expertise in {skills_str} and strengthened my ability to align technical initiatives with overarching organizational goals."
    elif bio:
        p2 = f"In my work as a {current_title}, {bio} Leveraging deep expertise in {skills_str}, I have built a proven history of designing reliable solutions, improving performance, and driving cross-functional alignment."
    else:
        p2 = f"Throughout my {years_exp}+ years as a {current_title}, I have built deep technical proficiency across {skills_str}. In reviewing the requirements for {job_title}, I noted your focus on {summary.lower() if summary else 'building high-performance data and software systems'}, an area where my background enables me to deliver immediate value."

    # --- 4. Career Story / Custom Focus / Scale Context ---
    p3_parts = []
    if career_story:
        p3_parts.append(career_story)

    # Scale context
    if company_size and ("10,000" in company_size or "Enterprise" in company_size):
        p3_parts.append(f"Operating at {company}'s scale ({company_size}) demands systematic reliability, governance, and seamless stakeholder communication—principles that underpin my engineering methodology.")
    elif company_size and ("1-50" in company_size or "Startup" in company_size or "50-200" in company_size):
        p3_parts.append(f"I thrive in agile environments where rapid experimentation, proactive problem ownership, and wearing multiple hats are essential to velocity.")

    if custom_focus:
        p3_parts.append(f"In particular, {custom_focus}")

    if not p3_parts:
        if education:
            p3_parts.append(f"Backed by my educational background in {education}, I approach complex problem solving with fundamental analytical rigor paired with rapid execution velocity.")
        else:
            p3_parts.append(f"My technical capabilities in {skills_str} directly map to the day-to-day challenges of this role, and I am committed to maintaining exceptional engineering standards within your organization.")

    p3 = " ".join(p3_parts)

    # --- 5. Closing Sentiment ---
    if tone == "enthusiastic":
        p4 = f"I would welcome the opportunity to discuss how my background, energy, and hands-on skills can support {company}'s upcoming initiatives. Thank you for your time and consideration."
    elif tone == "confident":
        p4 = f"I look forward to discussing how my demonstrated ability to drive results and solve complex challenges will deliver immediate value to {company}. Thank you for your time and consideration."
    elif tone == "modern":
        p4 = f"I'd love the chance to connect and discuss how my skill set can support your roadmap at {company}. Thank you for your consideration."
    else: # professional
        p4 = f"Thank you for considering my application. I welcome the opportunity to discuss how my technical qualifications and proactive approach will contribute to {company}'s ongoing success."

    # Header block
    contact_line = f"{email} | {phone} | {location}".strip(" |")
    links_line = " | ".join(filter(None, [profile.get('linkedin_url', ''), profile.get('github_url', ''), profile.get('portfolio_url', '')]))
    header = f"{name}\n{contact_line}"
    if links_line:
        header += f"\n{links_line}"

    letter_body = f"""{header}

{salutation}

{p1}

{p2}

{p3}

{p4}

Sincerely,

{name}"""

    return letter_body.strip()


def call_gemini_cover_letter(job, profile, tone, focus_points, optional_info, api_key):
    """
    Direct Google Gemini API call using standard library urllib.
    Integrates all optional candidate inputs into a customized prompt.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    motivation = optional_info.get("motivation", "")
    achievements = optional_info.get("achievements", "")
    skills_highlight = optional_info.get("skills_highlight", "")
    career_story = optional_info.get("career_story", "")
    combined_focus = focus_points or optional_info.get("focus_points", "")

    prompt = f"""
Write a deeply personalized, human, and persuasive cover letter for the following job and candidate profile.
CRITICAL: Do NOT use generic template clichés (e.g. "I hope this letter finds you well", "Having long admired..."). Weave the candidate's exact achievements, metrics, motivation, and career story into an authentic narrative.

JOB DETAILS:
Title: {job.get('title')}
Company: {job.get('company')}
Company Origin Country: {job.get('company_country')}
Company Size: {job.get('company_size')}
Industry: {job.get('company_industry')}
Summary / Description: {job.get('summary') or job.get('description')}
Requirements: {job.get('requirements')}
Skills Desired: {job.get('skills')}

CANDIDATE PROFILE:
Name: {profile.get('full_name')}
Current Title: {profile.get('current_title')}
Years Experience: {profile.get('years_experience')}
Profile Skills: {profile.get('skills')}
Profile Bio: {profile.get('bio')}
Education: {profile.get('education')}
Location: {profile.get('location')}

OPTIONAL PERSONALIZATION INPUTS (CRITICAL TO INTEGRATE):
- Candidate's Motivation for joining {job.get('company')}: {motivation}
- Candidate's Key Quantified Achievements & Metrics: {achievements}
- Specific Skills Candidate wants to emphasize: {skills_highlight}
- Candidate's Career Trajectory / Story: {career_story}
- Additional Custom Focus / Instructions: {combined_focus}
- Desired Tone: {tone}

Formatting Instructions:
- Include Candidate Name & Contact Info at top.
- Appropriate professional salutation to {job.get('company')}.
- 3 to 4 cohesive, impactful paragraphs.
- If achievements or numbers are provided, highlight those exact achievements and metrics.
- Connect candidate skills directly to the role requirements.
- Professional sign-off.
"""
    req_data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1200}
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(req_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()


def generate_interview_prep(job, profile):
    """
    Generates comprehensive interview prep questions categorized into:
    1. Technical & Role-Specific Questions with Model Answers & Key Concepts
    2. Behavioral (STAR framework) Questions with Coaching Tips
    3. Company & Scale Situational Questions
    4. Reverse-Interview Questions (Smart questions for candidate to ask)
    """
    job_title = job.get("title", "Data Scientist")
    company = job.get("company", "Company")
    country = job.get("company_country", "Global")
    size = job.get("company_size", "Enterprise")
    industry = job.get("company_industry", "Tech")
    summary = job.get("summary", "")

    # Role identification
    title_lower = job_title.lower()
    is_ds = "data scientist" in title_lower or "data science" in title_lower
    is_ml = "machine learning" in title_lower or "ml" in title_lower
    is_nlp = "nlp" in title_lower or "language" in title_lower or "generative" in title_lower
    is_cv = "vision" in title_lower or "perception" in title_lower or "autonomous" in title_lower

    # 1. Technical Questions
    tech_questions = []
    if is_nlp:
        tech_questions = [
            {
                "id": "t1",
                "category": "Technical: Deep Learning & NLP",
                "question": "How do self-attention mechanisms operate in modern Transformer architectures, and what techniques do you use to mitigate quadratic memory complexity for long contexts?",
                "key_concepts": ["FlashAttention", "KV Cache", "Self-Attention (Q, K, V)", "Rotary Position Embeddings (RoPE)", "Sparse Attention"],
                "model_answer": "In standard scaled dot-product attention, attention is computed as softmax((Q K^T) / sqrt(d_k)) V, leading to O(N^2) memory and time complexity relative to sequence length N. To handle long sequences, modern approaches utilize: 1) FlashAttention, which tiles matrix multiplications into GPU SRAM to avoid costly High-Bandwidth Memory (HBM) IO bottlenecks; 2) Grouped-Query Attention (GQA) and Multi-Query Attention (MQA) to reduce KV-cache footprints during decoding; and 3) Sliding-window attention or linear attention approximations.",
                "evaluation_criteria": "Look for clarity on Query-Key-Value mechanics, GPU memory hierarchy/tiling (FlashAttention), and KV-caching trade-offs."
            },
            {
                "id": "t2",
                "category": "Technical: LLM Fine-tuning & Evaluation",
                "question": f"At {company}, model accuracy and hallucination reduction are critical. How would you design an automated benchmark suite to evaluate translation fluency or LLM output quality?",
                "key_concepts": ["BLEU / COMET / ROUGE", "LLM-as-a-Judge", "Human Evaluation ELO", "Adversarial Red-teaming", "Factual Consistency Metrics"],
                "model_answer": "A robust evaluation framework combines automated semantic metrics and calibrated LLM-as-a-Judge protocols. First, for translation or generation fidelity, rely on neural metric models like COMET rather than mere n-gram overlap (BLEU), as COMET correlates far better with human judgment. Second, build a golden benchmark set covering diverse edge cases, idiomatic expressions, and safety bounds. Third, employ LLM-as-a-Judge with multi-dimensional rubrics (fluency, factual precision, tone) backed by regular spot checks to calibrate against human agreement rates.",
                "evaluation_criteria": "Understanding why traditional n-gram metrics fail, utilizing learned metrics (COMET), and structuring golden benchmark evaluation sets."
            }
        ]
    elif is_cv:
        tech_questions = [
            {
                "id": "t1",
                "category": "Technical: Computer Vision & Sensors",
                "question": "How do you handle severe spatial-temporal sensor noise and multi-modal alignment (e.g. camera, LiDAR, radar) in real-time perception models?",
                "key_concepts": ["Early vs Late Sensor Fusion", "BEV (Bird's Eye View) Transforms", "Kalman Filters", "Temporal Transformer Encoders", "Latency Bounds"],
                "model_answer": "Modern perception architectures transform multi-view cameras and LiDAR point clouds into a unified Bird's-Eye-View (BEV) feature representation using cross-attention or depth-probabilistic lift-splat-shoot methods. Temporal fusion is achieved through recurrent neural networks or temporal cross-attention across past frames. For sensor noise and dropout, applying aggressive data augmentation (cutout, point cloud jitter) during training and maintaining Kalman Filter or Bayesian state estimation buffers ensures robustness against hardware dropouts.",
                "evaluation_criteria": "Understanding BEV transformations, sensor fusion trade-offs, temporal synchronization, and inference latency constraints."
            },
            {
                "id": "t2",
                "category": "Technical: Edge Deployment & Quantization",
                "question": "What is your step-by-step strategy to compress a deep vision model to achieve <20ms inference on embedded hardware without significant mAP degradation?",
                "key_concepts": ["PTQ (Post-Training Quantization) vs QAT (Quantization-Aware Training)", "INT8 / FP16 precision", "Knowledge Distillation", "Structured Pruning", "ONNX / TensorRT / TFLite"],
                "model_answer": "First, profile the model using TensorRT or ONNX Runtime to identify memory-bound operators and convolutional bottlenecks. Second, apply INT8 Quantization-Aware Training (QAT), which models quantization noise during backprop to preserve high precision on sensitive layers. Third, utilize Knowledge Distillation where a large teacher network guides a lightweight student architecture. Finally, optimize kernel fusion to eliminate intermediate memory transfers.",
                "evaluation_criteria": "Distinction between PTQ and QAT, knowledge distillation concepts, and hardware profiling experience."
            }
        ]
    else:
        tech_questions = [
            {
                "id": "t1",
                "category": "Technical: Statistical Experimentation & A/B Testing",
                "question": f"Suppose we launch an A/B test for a new algorithmic feature at {company}. The test shows a +2.5% increase in conversion, but p-value is 0.07. Would you recommend shipping it? How do you diagnose and decide?",
                "key_concepts": ["p-value & Type I/II error", "Sample Ratio Mismatch (SRM)", "Power Analysis", "Network Effects / Spillover", "Bayesian Decision Making"],
                "model_answer": "I would not ship immediately based solely on p=0.07 without systematic diagnostics. First, I check for Sample Ratio Mismatch (SRM) using a Chi-square test on visitor traffic to ensure randomization wasn't biased. Second, I inspect secondary guardrail metrics (e.g. latency, churn, engagement time) to check for unintended regressions. Third, I assess the test duration and statistical power—did we reach the pre-experiment Minimum Detectable Effect (MDE)? If power was borderline and user traffic allows, I would extend the run for a predetermined cycle to account for day-of-week seasonality. Alternatively, I would apply a Bayesian decision framework to weigh expected financial upside against downside risk.",
                "evaluation_criteria": "Mentioning SRM checks, pre-experimental power, guardrail metrics, and business decision frameworks rather than purely dogmatic p < 0.05 cutoff."
            },
            {
                "id": "t2",
                "category": "Technical: Machine Learning at Scale & Imbalance",
                "question": "How do you diagnose and address severe class imbalance (e.g. 99.9% negative vs 0.1% positive) when training predictive risk or click-through models?",
                "key_concepts": ["PR-AUC vs ROC-AUC", "Focal Loss", "Cost-sensitive Learning", "Downsampling with calibration", "Stratified K-Fold"],
                "model_answer": "In severe imbalance scenarios, standard accuracy and ROC-AUC can be misleading because a high true negative rate inflates the score. I evaluate models using Precision-Recall AUC (PR-AUC) and Expected Calibration Error (ECE). To train: 1) Downsample the majority class while applying Platt scaling or isotonic regression post-hoc to recalibrate predicted probabilities back to true base rates; 2) Utilize Focal Loss or weighted cross-entropy to penalize errors on rare classes; 3) Engineer features with strong inductive bias like historical frequency or graph centrality.",
                "evaluation_criteria": "Understanding why ROC-AUC is misleading, using PR-AUC, cost-sensitive losses, and probability recalibration after downsampling."
            }
        ]

    # Additional Data Science Core Question
    tech_questions.append({
        "id": "t3",
        "category": "Technical: SQL & Feature Engineering",
        "question": "Walk me through how you write an efficient SQL query to calculate a 7-day rolling active user retention metric and detect sudden cohort drop-offs.",
        "key_concepts": ["Window Functions (AVG/COUNT OVER)", "PARTITION BY", "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW", "CTE (Common Table Expressions)", "Date truncation"],
        "model_answer": "I construct a Common Table Expression (CTE) aggregating daily active users per cohort using DATE_TRUNC. Next, I apply a window function: COUNT(DISTINCT user_id) OVER (PARTITION BY cohort_date ORDER BY activity_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW). To evaluate drop-offs, I compute LAG() to calculate day-over-day percentage deltas and flag any deviations exceeding 3 standard deviations.",
        "evaluation_criteria": "Comfort with window frame definitions (ROWS BETWEEN ...), partition strategies, and efficient aggregation."
    })

    # 2. Behavioral Questions (STAR Method)
    behavioral_questions = [
        {
            "id": "b1",
            "category": "Behavioral: Stakeholder Communication & Disagreement",
            "question": "Describe a situation where a business stakeholder or product manager wanted to launch a model or feature, but your data analysis indicated significant risks or flaws. How did you handle the conversation?",
            "star_guide": {
                "Situation": "Set the context: what was the feature, who was the stakeholder, and what were the stakes?",
                "Task": "Explain your responsibility to protect business KPIs while respecting product deadlines.",
                "Action": "How did you translate technical statistical metrics into tangible business impact (revenue, user churn, trust)? What alternative or compromise did you propose?",
                "Result": "What was the resolution, and how did it foster mutual trust for future decisions?"
            },
            "model_answer": "At my previous role, product leadership wanted to deploy a monetization ranking algorithm that boosted short-term ad revenue by 4%. However, my cohort analysis revealed a 6% drop in 30-day retention among power users. Instead of simply saying 'no', I modeled the lifetime customer value (LTV) impact, showing that the long-term revenue loss would outweigh short-term gains within 3 months. I proposed a hybrid constraint where ad frequency was capped based on user engagement level. We ran a follow-up test, achieving a +2.8% revenue lift while maintaining zero retention loss.",
            "evaluation_criteria": "Constructive collaboration, ability to translate metrics into dollars/retention, and offering proactive solutions rather than friction."
        },
        {
            "id": "b2",
            "category": f"Behavioral: Agility in {size} Organization",
            "question": f"Working at {company} ({size}, based in {country}), how do you balance scientific perfectionism with engineering speed when deadlines are pressing?",
            "star_guide": {
                "Situation": "A time when you faced a strict deadline to deliver an exploratory or production model.",
                "Task": "Delivering an effective baseline without getting paralyzed by exhaustive hyperparameter searches.",
                "Action": "How did you establish a simple benchmark first, validate assumptions quickly, and prioritize high-ROI steps?",
                "Result": "Delivering on time and iterating based on empirical data rather than speculation."
            },
            "model_answer": "I adhere to a 'heuristic baseline first' philosophy. When tasked with building a fraud anomaly model on a 3-week deadline, I resisted spending the first two weeks experimenting with complex deep architectures. Instead, I established a fast logistic regression and decision tree baseline within 48 hours to validate the data pipeline and set a benchmark PR-AUC of 0.72. This gave the engineering team an immediate end-to-end integration test. Over the remaining two weeks, targeted feature engineering on transactional velocity improved the score to 0.86, meeting the deadline with production confidence.",
            "evaluation_criteria": "Pragmatism, rapid baseline establishment, and understanding of engineering trade-offs."
        }
    ]

    # 3. Company & Culture Questions
    company_questions = [
        {
            "id": "c1",
            "category": f"Company Knowledge: Why {company}?",
            "question": f"Why do you specifically want to join {company}, and how do your career goals align with our mission in {industry}?",
            "talking_points": [
                f"Reference {company}'s origin in {country} and unique global or regional culture.",
                f"Highlight your interest in solving challenges at {company}'s scale ({size}).",
                f"Connect your specific passion for {summary or 'their data-driven culture'} with personal projects or past achievements."
            ],
            "model_answer": f"What sets {company} apart is how central data science is to your core user experience—not just as an afterthought, but as the foundational product engine. Coming from a background in quantitative modeling, I am energized by the opportunity to tackle challenges at {company}'s scale of {size}. Moreover, I deeply admire {company}'s engineering culture, having originated in {country} and maintained exceptional technical standards worldwide.",
            "evaluation_criteria": "Genuine company-specific knowledge beyond generic praise."
        }
    ]

    # 4. Reverse Interview: Smart Questions to Ask the Interviewer
    reverse_questions = [
        {
            "category": "Team & Workflow",
            "question": f"How is the Data Science team at {company} integrated with Product and Engineering—do data scientists own models end-to-end all the way to production deployment, or is there a dedicated MLOps handoff?"
        },
        {
            "category": "Technical Architecture",
            "question": "What does the typical experimentation and feature store lifecycle look like here when testing a new algorithmic hypothesis?"
        },
        {
            "category": "Impact & Growth",
            "question": f"For this {job_title} role, what would a breakthrough accomplishment look like in the first 90 days that would exceed your expectations?"
        },
        {
            "category": "Company Culture & Strategy",
            "question": f"With {company}'s expansion across {country} and international markets, what is currently the biggest technical bottleneck the team is working to solve?"
        }
    ]

    return {
        "job_title": job_title,
        "company": company,
        "company_country": country,
        "company_size": size,
        "technical_questions": tech_questions,
        "behavioral_questions": behavioral_questions,
        "company_questions": company_questions,
        "reverse_questions": reverse_questions
    }


def evaluate_interview_answer(question_id, question_text, user_answer, job):
    """
    Analyzes candidate's practice interview answer and returns:
    - Score (out of 100)
    - Key Strengths
    - Missing Elements / Areas for Improvement
    - Recommended Model Answer
    - Keyword Analysis
    """
    if not user_answer or len(user_answer.strip()) < 15:
        return {
            "score": 30,
            "strengths": ["You attempted the question."],
            "improvements": ["Your response was very brief. Aim for at least 3-5 sentences providing context, specific technical methodologies, and measurable outcomes."],
            "feedback": "Try applying the STAR method (Situation, Task, Action, Result) for behavioral questions, or detailing the algorithmic trade-offs for technical questions.",
            "model_answer": "Review the full recommended answer above to incorporate deeper technical vocabulary and structured problem-solving."
        }

    user_text = user_answer.strip()
    words = user_text.split()
    word_count = len(words)

    # Broader keyword scanning across tech, product, business, design
    domain_keywords = [
        "baseline", "metric", "validation", "experiment", "trade-off", "accuracy", "precision",
        "recall", "auc", "latency", "sql", "pipeline", "stakeholder", "impact", "retention",
        "hypothesis", "feature", "data", "model", "python", "test", "result", "revenue", "scale",
        "architecture", "agile", "sprint", "kpi", "roi", "customer", "user", "design", "security",
        "optimization", "lead", "strategy", "roadmap", "framework", "system", "performance"
    ]
    star_markers = ["situation", "task", "action", "result", "when", "decided", "built", "implemented", "achieved", "learned", "delivered", "solved", "reduced", "increased"]

    found_keywords = [w for w in domain_keywords if re.search(r'\b' + re.escape(w), user_text, re.IGNORECASE)]
    found_star = [w for w in star_markers if re.search(r'\b' + re.escape(w), user_text, re.IGNORECASE)]

    # Scoring algorithm
    base_score = 50
    if word_count > 45:
        base_score += 15
    elif word_count > 25:
        base_score += 10

    # Keyword richness
    kw_bonus = min(20, len(found_keywords) * 4)
    base_score += kw_bonus

    # Structure check (STAR / problem-solving)
    star_bonus = min(15, len(found_star) * 3)
    base_score += star_bonus

    score = min(98, base_score)

    if score >= 85:
        rating = "Excellent / High Pass"
    elif score >= 70:
        rating = "Good / Passing Candidate"
    elif score >= 50:
        rating = "Borderline / Needs Polish"
    else:
        rating = "Needs Substantial Practice"

    strengths = []
    improvements = []

    if word_count >= 50:
        strengths.append(f"Good detail and depth ({word_count} words). You provided adequate context.")
    else:
        improvements.append("Expand on your answer with concrete examples and specific quantitative metrics (e.g. % improvement, latency reduction, dollar impact).")

    if found_keywords:
        strengths.append(f"Strong professional vocabulary: included key domain terms ({', '.join(found_keywords[:5])}).")
    else:
        improvements.append("Incorporate more industry-standard technical terminology (e.g., specific evaluation metrics, validation methods, architectural terms).")

    if len(found_star) >= 3:
        strengths.append("Clear narrative structure demonstrating proactive action and measurable resolution.")
    else:
        improvements.append("Anchor your answer in the STAR framework: clearly highlight the Action you personally took and the final Result achieved.")

    return {
        "score": score,
        "rating": rating,
        "word_count": word_count,
        "keywords_found": found_keywords,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": f"Your response scored {score}/100 ({rating}). By weaving in quantifiable outcomes and connecting your solution back to {job.get('company', 'the company')}'s business goals, you will stand out as a top-tier candidate."
    }

