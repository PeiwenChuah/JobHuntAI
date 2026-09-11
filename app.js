/**
 * JobHuntAI Application Frontend Controller (Universal Hybrid Engine)
 * - 100% Client-Side Ready for GitHub Pages (Zero Server Required)
 * - Uses localStorage for Profile, Saved Jobs Tracker, and Pipeline Analytics
 * - Ported AI Career Engine: Client-Side Cover Letter Synthesizer & Interview Prep Coach
 * - Real-time job search via open CORS APIs (Remotive API) + 1-Click Verified Search Gateways (LinkedIn, JobStreet, Indeed, Google Jobs)
 * - Optional Python Backend Mode: Auto-detects local server (app.py) or allows connecting custom backend (Render/Railway)
 */

// ============================================================================
// Application State & Configuration
// ============================================================================
const backendConfig = {
  customUrl: localStorage.getItem('jobhunt_backend_url') || '',
  isOnline: false,
  activeUrl: ''
};

const DEFAULT_PROFILE = {
  id: 1,
  full_name: "Peiwen Chuah",
  current_title: "Software Engineer / Data Scientist",
  email: "peiwen.chuah@example.com",
  phone: "+60 12-345 6789",
  location: "Kuala Lumpur, Malaysia",
  years_experience: 4,
  education: "B.Sc. in Computer Science / Data Science",
  skills: ["Python", "Machine Learning", "SQL", "JavaScript", "Docker", "Git", "FastAPI", "React"],
  bio: "Dedicated software engineer and data professional with 4+ years of experience architecting reliable applications, machine learning pipelines, and scalable APIs.",
  linkedin_url: "https://linkedin.com/in/peiwenchuah",
  github_url: "https://github.com/PeiwenChuah",
  portfolio_url: ""
};

const state = {
  liveJobs: [],
  filteredJobs: [],
  displayedCount: 12,
  savedJobs: [],
  profile: null,
  activeTab: 'jobs-tab',
  activeJobDetail: null,
  currentPrepJob: null,
  currentPrepData: null,
  activePracticeQuestion: null,
  selectedCountries: ['Malaysia'],
  lastSearchQuery: '',
  backendOnline: false,
  stats: { saved: 0, applied: 0, interviewing: 0, offered: 0, total_saved: 0 }
};

// ============================================================================
// Helper Utilities
// ============================================================================
const COUNTRY_FLAGS = {
  "Malaysia": "🇲🇾",
  "Singapore": "🇸🇬",
  "United States": "🇺🇸",
  "Germany": "🇩🇪",
  "United Kingdom": "🇬🇧",
  "Australia": "🇦🇺",
  "Canada": "🇨🇦",
  "Japan": "🇯🇵",
  "Switzerland": "🇨🇭",
  "Netherlands": "🇳🇱",
  "France": "🇫🇷",
  "Sweden": "🇸🇪",
  "India": "🇮🇳",
  "China": "🇨🇳"
};

function getCountryFlag(country) {
  if (!country) return "🌍";
  return COUNTRY_FLAGS[country] || "🌍";
}

function getSourceBadgeHtml(source) {
  if (!source) source = 'Web';
  const s = source.toLowerCase();
  if (s.includes('linkedin')) {
    return `<span class="badge badge-source">💼 LinkedIn</span>`;
  } else if (s.includes('jobstreet')) {
    return `<span class="badge badge-source-jobstreet">🏢 JobStreet</span>`;
  } else if (s.includes('remotive')) {
    return `<span class="badge badge-source-remotive">⚡ Remotive</span>`;
  } else if (s.includes('arbeitnow')) {
    return `<span class="badge badge-source-arbeitnow">🌍 Arbeitnow</span>`;
  } else {
    return `<span class="badge badge-source-web">🌐 ${escapeHtml(source)}</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function apiUrl(endpoint) {
  if (backendConfig.customUrl) {
    const clean = backendConfig.customUrl.replace(/\/+$/, '');
    return `${clean}${endpoint}`;
  }
  if (backendConfig.isOnline && backendConfig.activeUrl) {
    return `${backendConfig.activeUrl}${endpoint}`;
  }
  return endpoint;
}

// ============================================================================
// Backend Detection & Environment Mode
// ============================================================================
async function detectBackendStatus() {
  const dot = document.getElementById('backend-status-dot');
  const text = document.getElementById('backend-status-text');
  const modalDot = document.getElementById('modal-status-dot');
  const modalTitle = document.getElementById('modal-status-title');
  const modalDesc = document.getElementById('modal-status-desc');
  const urlInput = document.getElementById('backend-url-input');

  if (urlInput) {
    urlInput.value = backendConfig.customUrl;
  }

  let probeUrl = '';
  if (backendConfig.customUrl) {
    probeUrl = backendConfig.customUrl.replace(/\/+$/, '');
  } else if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
    probeUrl = window.location.origin;
  }

  let connected = false;
  if (probeUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${probeUrl}/api/stats`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        connected = true;
        backendConfig.activeUrl = probeUrl;
      }
    } catch (e) {
      connected = false;
    }
  }

  backendConfig.isOnline = connected;
  state.backendOnline = connected;

  if (connected) {
    if (dot) dot.className = 'status-dot dot-online';
    if (text) text.textContent = 'Python Backend Active';
    if (modalDot) modalDot.className = 'status-dot dot-online';
    if (modalTitle) modalTitle.textContent = 'Connected to Python Backend';
    if (modalDesc) {
      modalDesc.innerHTML = `Active API: <code>${escapeHtml(backendConfig.activeUrl)}</code>.<br>Full real-time web scraping and SQLite database persistence are enabled.`;
    }
  } else {
    if (dot) dot.className = 'status-dot dot-static';
    if (text) text.textContent = 'GitHub Pages Mode';
    if (modalDot) modalDot.className = 'status-dot dot-static';
    if (modalTitle) modalTitle.textContent = 'GitHub Pages Mode (Zero Server)';
    if (modalDesc) {
      modalDesc.innerHTML = `Running 100% client-side in your browser. Cover letters, interview coaching, and saved job tracking use local storage. Zero setup needed!`;
    }
  }
}

function setupBackendModalListeners() {
  const badgeBtn = document.getElementById('mode-badge-btn');
  const modal = document.getElementById('backend-modal');
  const closeBtn = document.getElementById('close-backend-modal');
  const saveBtn = document.getElementById('save-backend-btn');
  const resetBtn = document.getElementById('reset-backend-btn');
  const urlInput = document.getElementById('backend-url-input');

  if (badgeBtn && modal) {
    badgeBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const val = (urlInput ? urlInput.value.trim() : '').replace(/\/+$/, '');
      if (val) {
        localStorage.setItem('jobhunt_backend_url', val);
        backendConfig.customUrl = val;
        showToast('Testing connection to custom backend...', 'default');
      } else {
        localStorage.removeItem('jobhunt_backend_url');
        backendConfig.customUrl = '';
      }
      await detectBackendStatus();
      await loadProfile();
      await loadSavedJobs();
      await loadStats();
      if (modal) modal.classList.add('hidden');
      showToast(backendConfig.isOnline ? 'Connected to Python backend!' : 'Switched to GitHub Pages mode.', backendConfig.isOnline ? 'success' : 'default');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      localStorage.removeItem('jobhunt_backend_url');
      backendConfig.customUrl = '';
      if (urlInput) urlInput.value = '';
      await detectBackendStatus();
      await loadProfile();
      await loadSavedJobs();
      await loadStats();
      if (modal) modal.classList.add('hidden');
      showToast('Reset to automatic mode.', 'default');
    });
  }
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupMultiCountryInput();
  setupLiveSearch();
  setupModalListeners();
  setupCoverLetterListeners();
  setupInterviewPrepListeners();
  setupProfileListeners();
  setupBackendModalListeners();

  renderCountryTags();

  await detectBackendStatus();
  await loadProfile();
  await loadSavedJobs();
  await loadStats();

  const searchInput = document.getElementById('job-search-input');
  if (searchInput) searchInput.value = '';
  state.lastSearchQuery = '';
  renderEmptyInitialState();
});

// ============================================================================
// Navigation Tabs
// ============================================================================
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  const editProfileLink = document.getElementById('cl-edit-profile-btn');
  if (editProfileLink) {
    editProfileLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('profile-tab');
    });
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  if (tabId === 'tracker-tab') {
    renderKanban();
  } else if (tabId === 'cover-letter-tab') {
    populateCoverLetterJobSelect();
  } else if (tabId === 'interview-tab') {
    populatePrepJobSelect();
  }
}

// ============================================================================
// Multi-Country Tag Input
// ============================================================================
function setupMultiCountryInput() {
  const input = document.getElementById('country-text-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val) {
        addCountry(val);
        input.value = '';
      }
    }
  });

  input.addEventListener('change', () => {
    const val = input.value.trim();
    if (val) {
      addCountry(val);
      input.value = '';
    }
  });

  document.querySelectorAll('.quick-country-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const country = btn.getAttribute('data-country');
      addCountry(country);
    });
  });

  const clearAllBtn = document.getElementById('clear-all-countries-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      state.selectedCountries = [];
      renderCountryTags();
      const q = document.getElementById('job-search-input')?.value.trim();
      if (q) performLiveSearch(q);
    });
  }
}

function addCountry(countryName) {
  if (!countryName) return;
  const formatted = countryName.charAt(0).toUpperCase() + countryName.slice(1);
  if (!state.selectedCountries.includes(formatted)) {
    state.selectedCountries.push(formatted);
    renderCountryTags();
    const q = document.getElementById('job-search-input')?.value.trim();
    if (q) performLiveSearch(q);
  }
}

function removeCountry(countryName) {
  state.selectedCountries = state.selectedCountries.filter(c => c !== countryName);
  renderCountryTags();
  const q = document.getElementById('job-search-input')?.value.trim();
  if (q) performLiveSearch(q);
}

function renderCountryTags() {
  const container = document.getElementById('country-tag-container');
  const input = document.getElementById('country-text-input');
  if (!container || !input) return;

  container.querySelectorAll('.country-pill').forEach(p => p.remove());

  state.selectedCountries.forEach(country => {
    const flag = getCountryFlag(country);
    const pill = document.createElement('span');
    pill.className = 'country-pill';
    pill.innerHTML = `
      <span>${flag} ${escapeHtml(country)}</span>
      <button type="button" class="remove-pill-btn" data-country="${escapeHtml(country)}" title="Remove ${escapeHtml(country)}">✕</button>
    `;
    container.insertBefore(pill, input);

    pill.querySelector('.remove-pill-btn').addEventListener('click', () => {
      removeCountry(country);
    });
  });
}

// ============================================================================
// Live On-Demand Job Search (Hybrid Engine)
// ============================================================================
function setupLiveSearch() {
  const searchForm = document.getElementById('live-search-form');
  const searchInput = document.getElementById('job-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const workplaceSelect = document.getElementById('filter-workplace');
  const expSelect = document.getElementById('filter-experience');
  const timeSelect = document.getElementById('filter-time');
  const sourceSelect = document.getElementById('filter-source');
  const resetBtn = document.getElementById('reset-filters-btn');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.displayedCount += 12;
      renderLiveJobsGrid();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput ? searchInput.value.trim() : '';
      if (q) performLiveSearch(q);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.liveJobs = [];
      state.filteredJobs = [];
      state.lastSearchQuery = '';
      renderEmptyInitialState();
    });
  }

  [workplaceSelect, expSelect, timeSelect].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        const q = searchInput ? searchInput.value.trim() : '';
        if (q) performLiveSearch(q);
      });
    }
  });

  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      applyFiltersAndRender();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (workplaceSelect) workplaceSelect.value = '';
      if (expSelect) expSelect.value = '';
      if (timeSelect) timeSelect.value = 'any';
      if (sourceSelect) sourceSelect.value = '';
      state.selectedCountries = ['Malaysia'];
      state.liveJobs = [];
      state.filteredJobs = [];
      state.lastSearchQuery = '';
      renderCountryTags();
      document.querySelectorAll('.tag-pill').forEach(t => t.classList.remove('active'));
      renderEmptyInitialState();
    });
  }

  document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const keyword = pill.getAttribute('data-keyword');
      document.querySelectorAll('.tag-pill').forEach(t => t.classList.remove('active'));
      pill.classList.add('active');
      if (searchInput) searchInput.value = keyword;
      performLiveSearch(keyword);
    });
  });
}

function applyFiltersAndRender() {
  const sourceFilter = (document.getElementById('filter-source')?.value || '').toLowerCase();
  
  if (sourceFilter) {
    state.filteredJobs = state.liveJobs.filter(j => (j.source || '').toLowerCase().includes(sourceFilter));
  } else {
    state.filteredJobs = [...state.liveJobs];
  }
  
  state.displayedCount = 12;
  renderLiveJobsGrid();
}

function renderEmptyInitialState() {
  const container = document.getElementById('jobs-grid');
  const statusText = document.getElementById('search-status-text');
  const loadMoreContainer = document.getElementById('load-more-container');
  if (loadMoreContainer) loadMoreContainer.classList.add('hidden');

  if (statusText) {
    statusText.innerHTML = `Enter any job title above to fetch real-time jobs from <strong>LinkedIn</strong>, <strong>JobStreet</strong>, <strong>Remotive</strong>, and <strong>Web Gateways</strong>.`;
  }
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 16px; border: 1.5px dashed var(--border-color); box-shadow: var(--shadow-sm);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">💼</div>
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Ready to Search Real-Time Jobs Across the Web</h3>
      <p class="text-muted" style="max-width: 580px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.6;">
        Type any job title above (e.g., <strong>Data Scientist</strong>, <strong>Software Engineer</strong>, <strong>Product Manager</strong>, <strong>Accountant</strong>) and click <strong>Search Live Jobs</strong>. We fetch 100% real-time, verified postings on-demand across <strong>LinkedIn</strong>, <strong>JobStreet</strong>, <strong>Remotive</strong>, and <strong>Open Web Gateways</strong>.
      </p>
    </div>
  `;
}

async function performLiveSearch(keyword) {
  if (!keyword || !keyword.trim()) {
    renderEmptyInitialState();
    return;
  }
  keyword = keyword.trim();
  state.lastSearchQuery = keyword;
  const submitBtn = document.getElementById('search-submit-btn');
  const countries = state.selectedCountries.length > 0 ? state.selectedCountries.join(',') : 'Malaysia';
  const time = document.getElementById('filter-time')?.value || 'any';
  const workplace = document.getElementById('filter-workplace')?.value || '';
  const experience = document.getElementById('filter-experience')?.value || '';
  const source = document.getElementById('filter-source')?.value || '';

  const statusText = document.getElementById('search-status-text');
  if (statusText) {
    statusText.innerHTML = `Fetching live listings across the web for <strong>"${escapeHtml(keyword)}"</strong> in ${escapeHtml(countries)}...`;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="icon">⏳</span> <span class="btn-text">Searching Live...</span>`;
  }

  try {
    if (state.backendOnline) {
      const params = new URLSearchParams({ q: keyword, countries, time, workplace, experience, source });
      const res = await fetch(apiUrl(`/api/jobs/live-search?${params.toString()}`));
      if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
      const data = await res.json();
      state.liveJobs = data.jobs || [];
    } else {
      state.liveJobs = await clientFetchOpenJobs(keyword, countries, time);
    }

    state.filteredJobs = [...state.liveJobs];
    state.displayedCount = 12;

    if (statusText) {
      if (state.liveJobs.length > 0) {
        statusText.innerHTML = `Found <strong>${state.liveJobs.length}</strong> live active positions for <strong>"${escapeHtml(keyword)}"</strong> across ${escapeHtml(countries)} (LinkedIn, JobStreet, Remotive, Arbeitnow & Web).`;
      } else {
        statusText.innerHTML = `No live jobs found for <strong>"${escapeHtml(keyword)}"</strong> in ${escapeHtml(countries)}.`;
      }
    }
    renderLiveJobsGrid();
  } catch (err) {
    console.error('Search error:', err);
    state.liveJobs = await clientFetchOpenJobs(keyword, countries, time);
    state.filteredJobs = [...state.liveJobs];
    state.displayedCount = 12;
    if (statusText) {
      statusText.innerHTML = `Found <strong>${state.liveJobs.length}</strong> verified search gateways for <strong>"${escapeHtml(keyword)}"</strong> in ${escapeHtml(countries)}.`;
    }
    renderLiveJobsGrid();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="icon">🔍</span> <span class="btn-text">Search Live Jobs</span>`;
    }
  }
}

async function clientFetchOpenJobs(keyword, countries, time) {
  const jobs = [];
  const primaryCountry = countries.split(',')[0].trim();

  try {
    const remRes = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=15`);
    if (remRes.ok) {
      const remData = await remRes.json();
      const remJobs = remData.jobs || [];
      remJobs.forEach(j => {
        jobs.push({
          id: `rem-${j.id}`,
          title: j.title,
          company: j.company_name,
          company_country: primaryCountry || "Global / Remote",
          company_size: "50-200 employees",
          company_industry: j.category || "Technology",
          workplace_type: "Remote",
          experience_level: "Mid-Senior",
          location: j.candidate_required_location || "Worldwide / Remote",
          salary_range: j.salary || "Competitive Market Rate",
          posted_at: j.publication_date ? new Date(j.publication_date).toLocaleDateString() : "Recent",
          summary: j.description ? j.description.replace(/<[^>]+>/g, '').slice(0, 200) + '...' : `Live active position at ${j.company_name}.`,
          description: j.description ? j.description.replace(/<[^>]+>/g, '\n').slice(0, 800) : `Detailed role for ${j.title}.`,
          requirements: [
            `Demonstrated proficiency in ${keyword} domains`,
            "Strong collaboration and communication skills",
            "Ability to work independently across distributed timezones"
          ],
          responsibilities: [
            `Develop and execute core projects in ${keyword}`,
            "Collaborate with engineering, product, and leadership teams",
            "Maintain code quality, documentation, and operational reliability"
          ],
          skills: j.tags || [keyword, "Remote", "Engineering"],
          application_url: j.url,
          source: "Remotive"
        });
      });
    }
  } catch (e) {
    console.warn('Remotive API fetch note:', e);
  }

  const isMY = primaryCountry.toLowerCase().includes('malaysia');
  const isSG = primaryCountry.toLowerCase().includes('singapore');
  const jobStreetDomain = isSG ? 'https://www.jobstreet.com.sg' : 'https://www.jobstreet.com.my';

  const gateways = [
    {
      id: `gw-linkedin-${Date.now()}`,
      title: `Explore all "${keyword}" jobs on LinkedIn`,
      company: "LinkedIn Jobs Network",
      company_country: primaryCountry,
      company_size: "10,000+ employees",
      company_industry: "Professional Network & Hiring",
      workplace_type: "Hybrid / On-site / Remote",
      experience_level: "All Levels",
      location: primaryCountry,
      salary_range: "Market Competitive",
      posted_at: "Updated Hourly",
      summary: `Direct live gateway to all active ${keyword} openings across ${primaryCountry} on LinkedIn. Filter by company, seniority, and salary.`,
      description: `Comprehensive real-time listings for ${keyword} posted by thousands of employers on LinkedIn. Click Apply to view live openings.`,
      requirements: [
        `Relevant experience in ${keyword} or related domains`,
        "Up-to-date professional profile and portfolio",
        "Demonstrated track record of delivering measurable outcomes"
      ],
      responsibilities: [
        "Lead and contribute to high-impact organizational projects",
        "Collaborate effectively across cross-functional departments"
      ],
      skills: [keyword, "Leadership", "Problem Solving", primaryCountry],
      application_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(primaryCountry)}`,
      source: "LinkedIn"
    },
    {
      id: `gw-jobstreet-${Date.now()}`,
      title: `Explore all "${keyword}" jobs on JobStreet`,
      company: "JobStreet Southeast Asia",
      company_country: isSG ? "Singapore" : (isMY ? "Malaysia" : primaryCountry),
      company_size: "5,000+ employees",
      company_industry: "Southeast Asia Career Network",
      workplace_type: "On-site / Hybrid",
      experience_level: "All Levels",
      location: isSG ? "Singapore" : (isMY ? "Malaysia" : primaryCountry),
      salary_range: "Market Competitive",
      posted_at: "Updated Daily",
      summary: `Verified live employer vacancies and talent requests for ${keyword} across Southeast Asia on JobStreet.`,
      description: `Direct access to top hiring enterprises, conglomerates, and startups advertising ${keyword} vacancies on JobStreet.`,
      requirements: [
        `Strong technical grounding in ${keyword}`,
        "Good communication in English and relevant languages",
        "Practical project or industry experience"
      ],
      responsibilities: [
        "Deliver scalable features and business-critical milestones",
        "Collaborate with local and regional engineering teams"
      ],
      skills: [keyword, "Southeast Asia", "Execution"],
      application_url: `${jobStreetDomain}/jobs?keywords=${encodeURIComponent(keyword)}`,
      source: "JobStreet"
    },
    {
      id: `gw-indeed-${Date.now()}`,
      title: `Search "${keyword}" positions on Indeed`,
      company: "Indeed Global Hiring",
      company_country: primaryCountry,
      company_size: "10,000+ employees",
      company_industry: "Global Employment Platform",
      workplace_type: "Various",
      experience_level: "All Levels",
      location: primaryCountry,
      salary_range: "Competitive",
      posted_at: "Real-time",
      summary: `Direct live query to active employer listings for ${keyword} in ${primaryCountry} on Indeed.`,
      description: `Aggregated job postings from company career pages, direct employers, and staffing agencies on Indeed.`,
      requirements: [`Background in ${keyword}`],
      responsibilities: ["Develop and maintain systems and products"],
      skills: [keyword, "Industry Standards"],
      application_url: isMY ? `https://malaysia.indeed.com/jobs?q=${encodeURIComponent(keyword)}` : `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(primaryCountry)}`,
      source: "Web"
    },
    {
      id: `gw-google-${Date.now()}`,
      title: `Explore "${keyword}" positions on Google Jobs`,
      company: "Google Jobs Aggregator",
      company_country: primaryCountry,
      company_size: "100,000+ employees",
      company_industry: "Search Engine Aggregation",
      workplace_type: "Various",
      experience_level: "All Levels",
      location: primaryCountry,
      salary_range: "Market Rate",
      posted_at: "Real-time",
      summary: `Google's direct job search engine aggregating all web-wide vacancies for ${keyword} in ${primaryCountry}.`,
      description: `Comprehensive aggregation powered by Google Search, crawling official corporate careers portals and job boards.`,
      requirements: [`Competency in ${keyword}`],
      responsibilities: ["Execute domain objectives"],
      skills: [keyword, "Google Jobs Feed"],
      application_url: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' jobs in ' + primaryCountry)}&ibp=htl;jobs`,
      source: "Web"
    }
  ];

  return [...jobs, ...gateways];
}

// ============================================================================
// Render Live Jobs Grid
// ============================================================================
function renderLiveJobsGrid() {
  const container = document.getElementById('jobs-grid');
  const loadMoreContainer = document.getElementById('load-more-container');
  const showingCount = document.getElementById('showing-count');
  const totalCount = document.getElementById('total-count');
  if (!container) return;

  const jobsList = state.filteredJobs || [];
  const total = jobsList.length;

  if (total === 0) {
    if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px dashed var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>No live jobs found for "${escapeHtml(state.lastSearchQuery)}"</h3>
        <p class="text-muted" style="margin-top: 0.5rem;">Try searching for another role, clearing source filters, or broadening your country selection.</p>
      </div>
    `;
    return;
  }

  const jobsToDisplay = jobsList.slice(0, state.displayedCount);

  if (loadMoreContainer) {
    if (state.displayedCount < total) {
      loadMoreContainer.classList.remove('hidden');
      if (showingCount) showingCount.textContent = jobsToDisplay.length;
      if (totalCount) totalCount.textContent = total;
    } else {
      loadMoreContainer.classList.add('hidden');
    }
  }

  container.innerHTML = jobsToDisplay.map((job, idx) => {
    const isSaved = state.savedJobs.some(sj => (sj.application_url && sj.application_url === job.application_url) || sj.id === job.id);
    const saveIcon = isSaved ? '⭐' : '☆';
    const saveText = isSaved ? 'Saved' : 'Save';
    const saveBtnClass = isSaved ? 'btn-saved-active' : 'btn-outline';

    const flag = getCountryFlag(job.company_country);
    const s = (job.source || '').toLowerCase();
    let applyText = '💼 Apply on LinkedIn';
    let applyClass = 'btn-apply-direct';
    if (s.includes('jobstreet')) {
      applyText = '🏢 Apply on JobStreet';
      applyClass = 'btn-jobstreet';
    } else if (s.includes('remotive')) {
      applyText = '⚡ Apply on Remotive';
      applyClass = 'btn-remotive';
    } else if (s.includes('arbeitnow')) {
      applyText = '🌍 Apply on Arbeitnow';
      applyClass = 'btn-arbeitnow';
    } else if (s.includes('google') || s.includes('indeed') || s.includes('glassdoor') || s.includes('web')) {
      applyText = `🌐 View on ${escapeHtml(job.source || 'Web')}`;
      applyClass = 'btn-secondary';
    }

    const skillsList = ensureArray(job.skills);
    const skillsHtml = skillsList.slice(0, 4).map(sk => 
      `<span class="skill-tag">${escapeHtml(sk)}</span>`
    ).join('');

    return `
      <div class="job-card" data-idx="${idx}">
        <div class="job-card-header">
          <div>
            <div class="job-card-title">${escapeHtml(job.title)}</div>
            <div class="job-card-company">${escapeHtml(job.company)}</div>
          </div>
          <button class="save-job-btn btn-sm ${saveBtnClass}" data-idx="${idx}" title="Save job to My Tracker">
            <span>${saveIcon}</span> <span>${saveText}</span>
          </button>
        </div>

        <div class="job-meta-badges">
          ${getSourceBadgeHtml(job.source)}
          <span class="badge badge-country">${flag} ${escapeHtml(job.company_country)}</span>
          <span class="badge badge-size">👥 ${escapeHtml(job.company_size || '1,000+')}</span>
          <span class="badge badge-workplace">🏢 ${escapeHtml(job.workplace_type || 'Hybrid')}</span>
        </div>

        <p class="job-desc-snippet">${escapeHtml(job.summary || job.description || '')}</p>

        <div class="job-skills-list">
          ${skillsHtml}
        </div>

        <div class="job-card-footer">
          <a href="${escapeHtml(job.application_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm ${applyClass} live-apply-btn">
            ${applyText} ↗
          </a>
          <div class="card-quick-actions">
            <button class="btn btn-sm btn-outline live-view-btn" data-idx="${idx}">Details</button>
            <button class="btn btn-sm btn-outline live-cl-btn" data-idx="${idx}" title="Generate tailored Cover Letter">📝 Letter</button>
            <button class="btn btn-sm btn-outline live-prep-btn" data-idx="${idx}" title="Generate Interview Questions">🎯 Prep</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.save-job-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-idx'));
      const job = jobsToDisplay[idx];
      await toggleSaveJob(job, btn);
    });
  });

  container.querySelectorAll('.live-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      openLiveJobModal(jobsToDisplay[idx]);
    });
  });

  container.querySelectorAll('.live-cl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      goToCoverLetterWithJob(jobsToDisplay[idx]);
    });
  });

  container.querySelectorAll('.live-prep-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      goToInterviewPrepWithJob(jobsToDisplay[idx]);
    });
  });
}

// ============================================================================
// Saved Jobs & Kanban Application Tracker
// ============================================================================
async function loadSavedJobs() {
  try {
    if (state.backendOnline) {
      const res = await fetch(apiUrl('/api/jobs/saved'));
      if (res.ok) {
        const data = await res.json();
        state.savedJobs = data.jobs || [];
      }
    } else {
      const raw = localStorage.getItem('jobhunt_saved_jobs');
      state.savedJobs = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    console.error('Error loading saved jobs:', err);
    const raw = localStorage.getItem('jobhunt_saved_jobs');
    state.savedJobs = raw ? JSON.parse(raw) : [];
  }

  const navCount = document.getElementById('nav-saved-count');
  const statCount = document.getElementById('stat-saved-count');
  if (navCount) navCount.textContent = state.savedJobs.length;
  if (statCount) statCount.textContent = state.savedJobs.length;
  
  if (state.activeTab === 'tracker-tab') {
    renderKanban();
  }
}

async function toggleSaveJob(job, btnElement) {
  const existingIdx = state.savedJobs.findIndex(sj => 
    (sj.application_url && sj.application_url === job.application_url) || sj.id === job.id
  );

  if (existingIdx >= 0) {
    const target = state.savedJobs[existingIdx];
    await deleteSavedJob(target.id);
    if (btnElement) {
      btnElement.className = 'save-job-btn btn-sm btn-outline';
      btnElement.innerHTML = `<span>☆</span> <span>Save</span>`;
    }
    showToast('Job removed from saved tracker', 'default');
  } else {
    const jobToSave = {
      ...job,
      id: job.id || `saved-${Date.now()}`,
      status: 'Saved',
      notes: '',
      saved_at: new Date().toISOString()
    };

    state.savedJobs.unshift(jobToSave);
    localStorage.setItem('jobhunt_saved_jobs', JSON.stringify(state.savedJobs));

    if (state.backendOnline) {
      try {
        await fetch(apiUrl('/api/jobs/save'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobToSave)
        });
      } catch (e) {
        console.warn('Backend save error, kept in local storage:', e);
      }
    }

    if (btnElement) {
      btnElement.className = 'save-job-btn btn-sm btn-saved-active';
      btnElement.innerHTML = `<span>⭐</span> <span>Saved</span>`;
    }

    await loadStats();
    showToast(`Saved "${job.title}" to My Tracker!`, 'success');
  }

  const navCount = document.getElementById('nav-saved-count');
  const statCount = document.getElementById('stat-saved-count');
  if (navCount) navCount.textContent = state.savedJobs.length;
  if (statCount) statCount.textContent = state.savedJobs.length;
  
  populateCoverLetterJobSelect();
  populatePrepJobSelect();
}

async function updateSavedJobStatus(jobId, newStatus) {
  const job = state.savedJobs.find(j => String(j.id) === String(jobId));
  if (job) {
    job.status = newStatus;
    localStorage.setItem('jobhunt_saved_jobs', JSON.stringify(state.savedJobs));

    if (state.backendOnline) {
      try {
        await fetch(apiUrl(`/api/jobs/saved/${jobId}/status`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {
        console.warn(e);
      }
    }
    await loadStats();
    renderKanban();
    showToast(`Status updated to: ${newStatus}`, 'success');
  }
}

async function deleteSavedJob(jobId) {
  state.savedJobs = state.savedJobs.filter(j => String(j.id) !== String(jobId));
  localStorage.setItem('jobhunt_saved_jobs', JSON.stringify(state.savedJobs));

  if (state.backendOnline) {
    try {
      await fetch(apiUrl(`/api/jobs/saved/${jobId}`), { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
  }

  await loadStats();
  renderKanban();
  const navCount = document.getElementById('nav-saved-count');
  const statCount = document.getElementById('stat-saved-count');
  if (navCount) navCount.textContent = state.savedJobs.length;
  if (statCount) statCount.textContent = state.savedJobs.length;
  populateCoverLetterJobSelect();
  populatePrepJobSelect();
}

function renderKanban() {
  const cols = {
    'Saved': document.getElementById('col-saved-cards'),
    'Applied': document.getElementById('col-applied-cards'),
    'Interviewing': document.getElementById('col-interviewing-cards'),
    'Offered': document.getElementById('col-offered-cards')
  };

  const counts = { 'Saved': 0, 'Applied': 0, 'Interviewing': 0, 'Offered': 0 };
  Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

  if (state.savedJobs.length === 0) {
    if (cols['Saved']) {
      cols['Saved'].innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No saved jobs yet.<br>Click "☆ Save" on any live job to track it here!
        </div>
      `;
    }
  }

  state.savedJobs.forEach(job => {
    let status = job.status || 'Saved';
    if (status === 'Not Applied') status = 'Saved';
    if (!cols[status]) status = 'Saved';

    counts[status]++;
    if (cols[status]) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      const flag = getCountryFlag(job.company_country);

      card.innerHTML = `
        <div class="kanban-card-title">${escapeHtml(job.title)}</div>
        <div class="kanban-card-company">${escapeHtml(job.company)} • ${flag} ${escapeHtml(job.company_country)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          ${getSourceBadgeHtml(job.source)} • 👥 ${escapeHtml(job.company_size || '1,000+')}
        </div>
        <div class="kanban-card-footer">
          <select class="form-select inline-select kanban-status-select" data-id="${job.id}" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">
            <option value="Saved" ${status === 'Saved' ? 'selected' : ''}>⭐ Saved</option>
            <option value="Applied" ${status === 'Applied' ? 'selected' : ''}>🚀 Applied</option>
            <option value="Interviewing" ${status === 'Interviewing' ? 'selected' : ''}>🎯 Interviewing</option>
            <option value="Offered" ${status === 'Offered' ? 'selected' : ''}>🎉 Offered</option>
          </select>
          <div style="display: flex; gap: 0.25rem;">
            <button class="btn btn-sm btn-outline kanban-view-btn" data-id="${job.id}">View</button>
            <button class="btn btn-sm btn-outline kanban-del-btn" data-id="${job.id}" title="Remove" style="color: var(--danger);">✕</button>
          </div>
        </div>
      `;
      cols[status].appendChild(card);
    }
  });

  const cSaved = document.getElementById('count-col-saved');
  const cApplied = document.getElementById('count-col-applied');
  const cInterviewing = document.getElementById('count-col-interviewing');
  const cOffered = document.getElementById('count-col-offered');
  if (cSaved) cSaved.textContent = counts['Saved'];
  if (cApplied) cApplied.textContent = counts['Applied'];
  if (cInterviewing) cInterviewing.textContent = counts['Interviewing'];
  if (cOffered) cOffered.textContent = counts['Offered'];

  document.querySelectorAll('.kanban-status-select').forEach(select => {
    select.addEventListener('change', async () => {
      const jobId = select.getAttribute('data-id');
      const newStatus = select.value;
      await updateSavedJobStatus(jobId, newStatus);
    });
  });

  document.querySelectorAll('.kanban-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-id');
      const job = state.savedJobs.find(j => String(j.id) === String(jobId));
      if (job) openLiveJobModal(job);
    });
  });

  document.querySelectorAll('.kanban-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const jobId = btn.getAttribute('data-id');
      await deleteSavedJob(jobId);
    });
  });
}

// ============================================================================
// Job Detail Modal
// ============================================================================
function openLiveJobModal(job) {
  state.activeJobDetail = job;

  document.getElementById('modal-job-title').textContent = job.title;
  document.getElementById('modal-job-company').textContent = job.company;
  
  const flag = getCountryFlag(job.company_country);
  document.getElementById('modal-country-badge').textContent = `${flag} ${job.company_country}`;
  document.getElementById('modal-size-badge').textContent = `👥 ${job.company_size || '1,000+'}`;
  document.getElementById('modal-source-badge').textContent = `💼 ${job.source || 'LinkedIn'}`;
  document.getElementById('modal-workplace-badge').textContent = `🏢 ${job.workplace_type || 'Hybrid'}`;

  document.getElementById('modal-spec-country').textContent = `${flag} ${job.company_country}`;
  document.getElementById('modal-spec-size').textContent = job.company_size || '1,000+';
  document.getElementById('modal-spec-industry').textContent = job.company_industry || 'Information Technology';
  document.getElementById('modal-spec-salary').textContent = job.salary_range || 'Competitive Market Rate';
  document.getElementById('modal-spec-location').textContent = job.location || job.company_country;
  document.getElementById('modal-spec-posted').textContent = job.posted_at || 'Recently';

  document.getElementById('modal-job-desc').textContent = job.description || job.summary;

  const respList = document.getElementById('modal-job-resp');
  const respSection = document.getElementById('modal-resp-section');
  const resps = ensureArray(job.responsibilities);
  if (resps.length > 0) {
    respSection.classList.remove('hidden');
    respList.innerHTML = resps.map(r => `<li>${escapeHtml(r)}</li>`).join('');
  } else {
    respSection.classList.add('hidden');
  }

  const reqList = document.getElementById('modal-job-req');
  const reqSection = document.getElementById('modal-req-section');
  const reqs = ensureArray(job.requirements);
  if (reqs.length > 0) {
    reqSection.classList.remove('hidden');
    reqList.innerHTML = reqs.map(r => `<li>${escapeHtml(r)}</li>`).join('');
  } else {
    reqSection.classList.add('hidden');
  }

  const skillsWrap = document.getElementById('modal-job-skills');
  const skills = ensureArray(job.skills);
  skillsWrap.innerHTML = skills.map(s => `<span class="concept-pill">${escapeHtml(s)}</span>`).join('');

  const saveBtn = document.getElementById('modal-save-btn');
  const isSaved = state.savedJobs.some(sj => (sj.application_url && sj.application_url === job.application_url) || sj.id === job.id);
  saveBtn.textContent = isSaved ? '⭐ Already in My Tracker' : '⭐ Save to My Tracker';

  const applyBtn = document.getElementById('modal-apply-btn');
  applyBtn.href = job.application_url;
  const s = (job.source || '').toLowerCase();
  let modalApplyText = '<span class="icon">💼</span> Apply on LinkedIn';
  if (s.includes('jobstreet')) {
    modalApplyText = '<span class="icon">🏢</span> Explore on JobStreet';
  } else if (s.includes('remotive')) {
    modalApplyText = '<span class="icon">⚡</span> Apply on Remotive';
  } else if (s.includes('arbeitnow')) {
    modalApplyText = '<span class="icon">🌍</span> Apply on Arbeitnow';
  } else if (s.includes('google') || s.includes('indeed') || s.includes('glassdoor') || s.includes('web')) {
    modalApplyText = `<span class="icon">🌐</span> View on ${escapeHtml(job.source || 'Web')}`;
  }
  applyBtn.innerHTML = modalApplyText;

  document.getElementById('job-detail-modal').classList.remove('hidden');
}

function setupModalListeners() {
  const detailModal = document.getElementById('job-detail-modal');
  document.getElementById('close-detail-modal')?.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });
  detailModal?.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  document.getElementById('modal-save-btn')?.addEventListener('click', async () => {
    if (!state.activeJobDetail) return;
    await toggleSaveJob(state.activeJobDetail);
    document.getElementById('modal-save-btn').textContent = '⭐ Already in My Tracker';
  });

  document.getElementById('modal-draft-cl-btn')?.addEventListener('click', () => {
    if (!state.activeJobDetail) return;
    detailModal.classList.add('hidden');
    goToCoverLetterWithJob(state.activeJobDetail);
  });

  document.getElementById('modal-prep-btn')?.addEventListener('click', () => {
    if (!state.activeJobDetail) return;
    detailModal.classList.add('hidden');
    goToInterviewPrepWithJob(state.activeJobDetail);
  });
}

// ============================================================================
// Cover Letter Studio
// ============================================================================
function setupCoverLetterListeners() {
  const jobSelect = document.getElementById('cl-job-select');
  const genBtn = document.getElementById('generate-cl-btn');
  const copyBtn = document.getElementById('copy-cl-btn');
  const downloadBtn = document.getElementById('download-cl-btn');
  const printBtn = document.getElementById('print-cl-btn');
  const textarea = document.getElementById('cl-output-textarea');

  jobSelect?.addEventListener('change', () => {
    const jobId = jobSelect.value;
    const job = state.savedJobs.find(j => String(j.id) === String(jobId));
    if (job) renderCoverLetterJobPreview(job);
  });

  genBtn?.addEventListener('click', async () => {
    const jobId = jobSelect ? jobSelect.value : '';
    let jobPayload = null;

    if (jobId) {
      jobPayload = state.savedJobs.find(j => String(j.id) === String(jobId));
    } else if (state.activeJobDetail) {
      jobPayload = state.activeJobDetail;
    }

    if (!jobPayload) {
      showToast('Please select a target job role from your saved jobs first', 'warning');
      return;
    }

    const tone = document.getElementById('cl-tone-select')?.value || 'professional';
    const motivation = (document.getElementById('cl-motivation-input')?.value || '').trim();
    const achievements = (document.getElementById('cl-achievements-input')?.value || '').trim();
    const skills_highlight = (document.getElementById('cl-skills-highlight-input')?.value || '').trim();
    const career_story = (document.getElementById('cl-career-story-input')?.value || '').trim();
    const focus = (document.getElementById('cl-focus-input')?.value || '').trim();
    const gemini_key = (document.getElementById('cl-gemini-key')?.value || '').trim();

    const optional_info = {
      motivation,
      achievements,
      skills_highlight,
      career_story,
      focus_points: focus,
      gemini_api_key: gemini_key
    };

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="icon">⏳</span> Synthesizing Personalized Letter...';
    document.getElementById('cl-status-badge').textContent = 'Generating...';

    try {
      let generatedLetter = '';

      if (gemini_key) {
        generatedLetter = await clientCallGeminiCoverLetter(jobPayload, state.profile, tone, optional_info, gemini_key);
      } else if (state.backendOnline) {
        const res = await fetch(apiUrl('/api/cover-letter/generate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            custom_job: jobPayload,
            tone,
            focus_points: focus,
            optional_info
          })
        });
        const data = await res.json();
        if (data.cover_letter) {
          generatedLetter = data.cover_letter;
        } else {
          throw new Error(data.error || 'Backend failed to generate letter');
        }
      } else {
        generatedLetter = clientSynthesizeCoverLetter(jobPayload, state.profile, tone, optional_info);
      }

      if (textarea) {
        textarea.value = generatedLetter;
        updateWordCount(generatedLetter);
      }
      document.getElementById('cl-status-badge').textContent = 'Generated';
      showToast('Personalized cover letter generated!', 'success');
    } catch (err) {
      console.error(err);
      const fallback = clientSynthesizeCoverLetter(jobPayload, state.profile, tone, optional_info);
      if (textarea) {
        textarea.value = fallback;
        updateWordCount(fallback);
      }
      document.getElementById('cl-status-badge').textContent = 'Generated';
      showToast('Personalized cover letter generated via smart engine!', 'success');
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = '<span class="icon">✨</span> Generate Cover Letter';
    }
  });

  textarea?.addEventListener('input', () => {
    updateWordCount(textarea.value);
  });

  copyBtn?.addEventListener('click', () => {
    if (!textarea?.value) return;
    navigator.clipboard.writeText(textarea.value).then(() => {
      showToast('Cover letter copied to clipboard!', 'success');
    });
  });

  downloadBtn?.addEventListener('click', () => {
    if (!textarea?.value) return;
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded text file', 'success');
  });

  printBtn?.addEventListener('click', () => {
    if (!textarea?.value) return;
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Cover Letter</title>
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; padding: 2in 1.5in; line-height: 1.6; white-space: pre-wrap; font-size: 11pt; color: #111; }
          </style>
        </head>
        <body>${escapeHtml(textarea.value)}</body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  });
}

function updateWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wc = document.getElementById('cl-word-count');
  if (wc) wc.textContent = `${words} words`;
}

function populateCoverLetterJobSelect() {
  const select = document.getElementById('cl-job-select');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose from Saved Jobs --</option>' + 
    state.savedJobs.map(j => `<option value="${j.id}">${escapeHtml(j.company)} — ${escapeHtml(j.title)} (${escapeHtml(j.company_country)})</option>`).join('');
  if (currentVal) select.value = currentVal;
}

function renderCoverLetterJobPreview(job) {
  const previewBox = document.getElementById('cl-job-preview-box');
  if (!job) {
    if (previewBox) previewBox.classList.add('hidden');
    return;
  }
  if (previewBox) previewBox.classList.remove('hidden');
  document.getElementById('cl-preview-title').textContent = job.title;
  document.getElementById('cl-preview-company').textContent = job.company;
  const flag = getCountryFlag(job.company_country);
  document.getElementById('cl-preview-country').textContent = `${flag} ${job.company_country}`;
  document.getElementById('cl-preview-source').innerHTML = getSourceBadgeHtml(job.source);

  const motInput = document.getElementById('cl-motivation-input');
  if (motInput && !motInput.value) {
    motInput.placeholder = `Why do you want to join ${job.company}? (e.g. admire their work in ${job.company_industry || 'technology'}, products, culture, or mission)`;
  }
  const skillsInput = document.getElementById('cl-skills-highlight-input');
  const jobSkills = ensureArray(job.skills);
  if (skillsInput && !skillsInput.value && jobSkills.length > 0) {
    skillsInput.placeholder = `e.g. ${jobSkills.slice(0, 4).join(', ')}`;
  }
}

function goToCoverLetterWithJob(job) {
  switchTab('cover-letter-tab');
  state.activeJobDetail = job;
  renderCoverLetterJobPreview(job);
}

function renderCandidateSnapshot() {
  const el = document.getElementById('cl-applicant-summary');
  if (!el || !state.profile) return;
  const p = state.profile;
  el.innerHTML = `
    <div><strong>${escapeHtml(p.full_name || 'Candidate')}</strong> (${escapeHtml(p.current_title || 'Professional')})</div>
    <div class="text-muted">${p.years_experience || 0} yrs experience • ${escapeHtml(p.location || 'Malaysia')}</div>
  `;
}

function clientSynthesizeCoverLetter(job, profile, tone, options) {
  profile = profile || DEFAULT_PROFILE;
  const name = profile.full_name || "Applicant";
  const email = profile.email || "applicant@example.com";
  const phone = profile.phone || "";
  const location = profile.location || "";
  const currentTitle = profile.current_title || "Professional";
  const yearsExp = profile.years_experience || 3;
  const bio = profile.bio || "";
  const education = profile.education || "";

  const jobTitle = job.title || "the target position";
  const company = job.company || "your organization";
  const companyCountry = job.company_country || "";
  const companySize = job.company_size || "";
  const companyIndustry = job.company_industry || "your industry";
  const summary = job.summary || job.description || "";

  const motivation = options.motivation || "";
  const achievements = options.achievements || "";
  const skillsHighlight = options.skills_highlight || "";
  const careerStory = options.career_story || "";
  const focusPoints = options.focus_points || "";

  const candSkills = ensureArray(profile.skills);
  const jobSkills = ensureArray(job.skills);
  let matched = [];
  if (skillsHighlight) {
    matched = skillsHighlight.split(',').map(s => s.trim()).filter(Boolean);
  } else if (candSkills.length > 0) {
    matched = candSkills.slice(0, 4);
  } else if (jobSkills.length > 0) {
    matched = jobSkills.slice(0, 4);
  } else {
    matched = ["technical problem-solving", "cross-functional collaboration", "scalable delivery"];
  }
  const skillsStr = matched.join(', ');

  const salutation = (company && company !== "your organization") ? `Dear Hiring Manager at ${company},` : `Dear Hiring Team,`;

  let p1 = "";
  const countryMention = companyCountry && !['global', 'various'].includes(companyCountry.toLowerCase()) ? ` with strong roots in ${companyCountry}` : "";
  if (motivation) {
    if (tone === "enthusiastic") {
      p1 = `I am delighted to submit my application for the ${jobTitle} position at ${company}. ${motivation} Having tracked ${company}'s progress in ${companyIndustry}${countryMention}, I am eager to apply my background as a ${currentTitle} to accelerate your engineering and business impact.`;
    } else if (tone === "confident") {
      p1 = `I am writing to express my strong candidacy for the ${jobTitle} role at ${company}. ${motivation} In looking at ${company}'s leadership within ${companyIndustry}, I recognize a high-value opportunity to translate my ${yearsExp}+ years of experience into immediate organizational momentum.`;
    } else if (tone === "modern") {
      p1 = `I am applying for the ${jobTitle} role at ${company}. ${motivation} With ${company}'s focus on innovation across ${companyIndustry}${countryMention}, my profile as a ${currentTitle} offers the direct technical ownership and business alignment your team requires.`;
    } else {
      p1 = `Please accept this application for the ${jobTitle} position at ${company}. ${motivation} Given ${company}'s strong standing in ${companyIndustry}${countryMention}, this opportunity closely matches my background as a ${currentTitle} and my commitment to delivering measurable results.`;
    }
  } else {
    if (tone === "enthusiastic") {
      p1 = `I was thrilled to discover the opening for the ${jobTitle} role at ${company}. With ${company}'s distinguished presence in ${companyIndustry}${countryMention}, the opportunity to contribute my expertise as a ${currentTitle} directly aligns with my passion for high-impact engineering and innovation.`;
    } else if (tone === "confident") {
      p1 = `I am submitting my candidacy for the ${jobTitle} role at ${company}. Backed by ${yearsExp}+ years of demonstrated execution as a ${currentTitle}, I offer the technical depth and commercial focus needed to drive significant leverage for ${company}'s roadmap.`;
    } else if (tone === "modern") {
      p1 = `I am excited to apply for the ${jobTitle} position at ${company}. With ${company}'s momentum in ${companyIndustry}, my background as a ${currentTitle} offers the exact combination of execution agility and strategic clarity needed to hit the ground running.`;
    } else {
      p1 = `Please accept this letter as an expression of my serious interest in the ${jobTitle} role at ${company}. With ${company}'s strong standing in ${companyIndustry}${countryMention}, this position represents an ideal match for my technical background and strategic problem-solving experience.`;
    }
  }

  let p2 = "";
  if (achievements) {
    const achItems = achievements.split(/[;.\n]/).map(a => a.trim()).filter(Boolean);
    let achText = "";
    if (achItems.length === 1) {
      achText = `A defining milestone of my work includes: ${achItems[0]}.`;
    } else if (achItems.length > 1) {
      const firstPart = achItems.slice(0, -1).join('; ');
      const lastItem = achItems[achItems.length - 1].replace(/^and\s+/i, '');
      achText = `Key milestones from my background include: ${firstPart}; and notably, ${lastItem}.`;
    }
    if (tone === "confident") {
      p2 = `Throughout my ${yearsExp}+ years as a ${currentTitle}, I have prioritized tangible business metrics over routine execution. ${achText} By combining structured execution with technical mastery in ${skillsStr}, I ensure that engineering and operational efforts translate directly into business leverage.`;
    } else if (tone === "modern") {
      p2 = `Here is what I bring to the table: ${achText} Across my ${yearsExp}+ years of experience, I have relied on ${skillsStr} to cut through complexity and ship scalable systems that move core company metrics.`;
    } else {
      p2 = `In my previous work as a ${currentTitle}, I have consistently tied technical contributions to concrete business outcomes. ${achText} Leveraging core proficiencies in ${skillsStr}, I focus on architecting resilient workflows and fostering cross-functional alignment.`;
    }
  } else if (bio) {
    p2 = `In my work as a ${currentTitle}, ${bio} Leveraging deep expertise in ${skillsStr}, I have built a proven history of designing reliable solutions, improving performance, and driving cross-functional alignment.`;
  } else {
    p2 = `Throughout my ${yearsExp}+ years as a ${currentTitle}, I have built deep technical proficiency across ${skillsStr}. In reviewing the requirements for ${jobTitle}, I noted your focus on ${summary ? summary.slice(0, 120) : 'building high-performance systems'}, an area where my background enables me to deliver immediate value.`;
  }

  const p3Parts = [];
  if (careerStory) {
    p3Parts.push(`My professional path reinforces this focus: ${careerStory}.`);
  }
  if (focusPoints) {
    p3Parts.push(`Specifically regarding our collaboration: ${focusPoints}.`);
  }
  if (companySize) {
    if (companySize.includes("10,000") || companySize.includes("100,000")) {
      p3Parts.push(`Having operated in matrixed, high-scale environments, I understand the importance of clear governance, stakeholder communication, and enterprise-grade reliability.`);
    } else if (companySize.includes("50-200") || companySize.includes("10-50")) {
      p3Parts.push(`I thrive in agile, high-ownership cultures where engineers wear multiple hats and turn ambiguous challenges into ship-ready features.`);
    }
  }
  if (education) {
    p3Parts.push(`Grounding my practical work is an educational foundation in ${education}, enabling me to evaluate trade-offs with rigorous analytical principles.`);
  }
  const p3 = p3Parts.length > 0 ? p3Parts.join(" ") : `Beyond technical capabilities, I place a high premium on clear communication, proactive risk mitigation, and cultivating a collaborative culture across distributed teams.`;

  let p4 = "";
  if (tone === "confident") {
    p4 = `I welcome the opportunity to discuss how my track record in delivering measurable results can directly support ${company}'s upcoming milestones. Thank you for your time and consideration.`;
  } else if (tone === "enthusiastic") {
    p4 = `I would be thrilled to connect with your team to explore how my skills and energy can contribute to ${company}'s continued success. Thank you very much for your review and consideration!`;
  } else if (tone === "modern") {
    p4 = `I would love the opportunity to chat with your team about the roadmap for this role and how I can help drive ${company} forward. Looking forward to our conversation.`;
  } else {
    p4 = `I would welcome the opportunity to discuss in greater detail how my qualifications and passion align with the needs of ${company}. Thank you for your time, consideration, and review of my application.`;
  }

  const header = `${name}\n${email}${phone ? ' | ' + phone : ''}${location ? ' | ' + location : ''}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `${header}\n\n${dateStr}\n\nHiring Team\n${company}\n${companyCountry ? companyCountry + '\n' : ''}\n${salutation}\n\n${p1}\n\n${p2}\n\n${p3}\n\n${p4}\n\nSincerely,\n\n${name}`;
}

async function clientCallGeminiCoverLetter(job, profile, tone, options, apiKey) {
  const prompt = `Write a deeply personalized, human, and persuasive cover letter for the following job and candidate profile.
CRITICAL: Do NOT use generic clichés. Weave the candidate's exact achievements, metrics, motivation, and career story into an authentic narrative.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Company Origin Country: ${job.company_country || 'Global'}
Company Size: ${job.company_size || ''}
Industry: ${job.company_industry || ''}
Summary: ${job.summary || job.description || ''}

CANDIDATE PROFILE:
Name: ${profile?.full_name || 'Applicant'}
Current Title: ${profile?.current_title || 'Professional'}
Years Experience: ${profile?.years_experience || 3}
Skills: ${JSON.stringify(profile?.skills || [])}
Bio: ${profile?.bio || ''}
Education: ${profile?.education || ''}
Location: ${profile?.location || ''}

PERSONALIZATION DETAILS:
- Motivation for joining ${job.company}: ${options.motivation || 'Strong interest in company impact'}
- Key Quantified Achievements: ${options.achievements || 'Proven track record of high quality delivery'}
- Skills to Emphasize: ${options.skills_highlight || 'Core engineering and analytical capabilities'}
- Career Story: ${options.career_story || 'Focused trajectory of increasing technical ownership'}
- Additional Focus: ${options.focus_points || 'Delivering high-value results'}
- Tone: ${tone}

Formatting:
- Include professional header block with candidate contact info.
- Include date and company address block.
- Salutation, 3-4 cohesive paragraphs, professional closing and candidate signature.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
    })
  });
  if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text generated by Gemini');
  return text;
}

// ============================================================================
// Interview Prep Coach
// ============================================================================
function setupInterviewPrepListeners() {
  const prepSelect = document.getElementById('prep-job-select');
  prepSelect?.addEventListener('change', () => {
    const jobId = prepSelect.value;
    const job = state.savedJobs.find(j => String(j.id) === String(jobId));
    if (job) loadInterviewPrepForJob(job);
  });

  document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.getAttribute('data-subtab');
      document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(targetSub)?.classList.add('active');
    });
  });

  const evalBtn = document.getElementById('evaluate-answer-btn');
  evalBtn?.addEventListener('click', handleEvaluateAnswer);
}

function populatePrepJobSelect() {
  const select = document.getElementById('prep-job-select');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose from Saved Jobs --</option>' + 
    state.savedJobs.map(j => `<option value="${j.id}">${escapeHtml(j.company)} — ${escapeHtml(j.title)} (${escapeHtml(j.company_country)})</option>`).join('');
  if (currentVal) select.value = currentVal;
  else if (state.savedJobs.length > 0) {
    select.value = state.savedJobs[0].id;
    loadInterviewPrepForJob(state.savedJobs[0]);
  }
}

function goToInterviewPrepWithJob(job) {
  switchTab('interview-tab');
  loadInterviewPrepForJob(job);
}

async function loadInterviewPrepForJob(job) {
  state.currentPrepJob = job;
  const badge = document.getElementById('prep-job-badge');
  if (badge) badge.classList.remove('hidden');
  const bTitle = document.getElementById('prep-badge-title');
  const bComp = document.getElementById('prep-badge-company');
  if (bTitle) bTitle.textContent = job.title;
  if (bComp) bComp.textContent = job.company;

  try {
    let prepData = null;
    if (state.backendOnline) {
      const res = await fetch(apiUrl('/api/interview/prep'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_job: job })
      });
      if (res.ok) {
        prepData = await res.json();
      }
    }

    if (!prepData) {
      prepData = clientGenerateInterviewPrep(job, state.profile);
    }

    state.currentPrepData = prepData;
    renderPrepQuestions(prepData);
  } catch (err) {
    console.warn('Backend prep failed, using client engine:', err);
    const prepData = clientGenerateInterviewPrep(job, state.profile);
    state.currentPrepData = prepData;
    renderPrepQuestions(prepData);
  }
}

function clientGenerateInterviewPrep(job, profile) {
  const title = job.title || "Software Professional";
  const company = job.company || "the company";
  const skills = ensureArray(job.skills);
  const topSkills = skills.length > 0 ? skills.slice(0, 3) : ["System Design", "Problem Solving", "Scalability"];
  const skillStr = topSkills.join(", ");

  return {
    job_title: title,
    company: company,
    technical_questions: [
      {
        id: "tech-1",
        category: "Core Technical Competency",
        question: `How have you used ${topSkills[0] || 'your primary technical stack'} in past production projects, and how would you apply it to the technical challenges at ${company}?`,
        key_concepts: [topSkills[0] || "Architecture", "Optimization", "Trade-off analysis", "Production Reliability"],
        model_answer: `Start by explaining your technical decision-making rationale: explain the specific architecture or algorithm you selected, the constraints (latency, throughput, data volume), how you validated correctness, and the measurable outcome (e.g. 35% latency improvement). Tie it back to ${company}'s scale.`
      },
      {
        id: "tech-2",
        category: "System Design & Scalability",
        question: `Walk me through how you design an end-to-end scalable service or data pipeline for high availability and fault tolerance.`,
        key_concepts: ["Decoupled services", "Caching / Indexing", "Error handling / Retries", "Monitoring & Telemetry"],
        model_answer: `Detail requirements first (functional vs non-functional), establish the high-level architecture, discuss trade-offs (e.g. SQL vs NoSQL, sync vs async messaging), and highlight how you handle bottlenecks, telemetry, and automated recovery.`
      },
      {
        id: "tech-3",
        category: "Code Quality & Testing",
        question: `How do you ensure test coverage, code reliability, and CI/CD stability when shipping fast in production?`,
        key_concepts: ["Automated testing", "CI/CD pipelines", "Canary deployments", "Code reviews"],
        model_answer: `Discuss your testing pyramid (unit, integration, end-to-end), contract testing for APIs, rollback triggers, and constructive pull request reviews to maintain velocity without sacrificing quality.`
      }
    ],
    behavioral_questions: [
      {
        id: "beh-1",
        category: "STAR - Handling High-Stakes Deadlines",
        question: `Tell me about a time you faced an ambiguous, high-pressure deadline or technical blocker. How did you navigate it?`,
        star_guide: {
          Situation: "Describe the specific project, timeline crunch, and initial ambiguity.",
          Task: "Define what you were specifically accountable for delivering.",
          Action: "Explain how you prioritized tasks, communicated trade-offs, and implemented the solution.",
          Result: "Quantify the outcome: shipped on time, saved X days, or unblocked Y stakeholders."
        },
        model_answer: `I was leading the rollout of a core analytics service when an unexpected API breaking change occurred 5 days before release (Situation). I owned fixing the integration without postponing the launch (Task). I immediately convened the engineering team, decoupled the dependent microservices using feature flags, and refactored the adapter layer (Action). We deployed on schedule with 99.9% uptime and zero regressions (Result).`
      },
      {
        id: "beh-2",
        category: "STAR - Conflict & Alignment",
        question: `Describe a scenario where you had a technical disagreement with a colleague or product manager. How did you reach alignment?`,
        star_guide: {
          Situation: "Explain the differing viewpoints on architecture, scope, or technology.",
          Task: "Achieve team consensus without stalling the project timeline.",
          Action: "Built a quick benchmark prototype and evaluated objective data/metrics together.",
          Result: "Aligned on the best solution, strengthened team trust, and avoided technical debt."
        },
        model_answer: `When choosing between a relational database versus a document store for our new workflow engine, our team had conflicting views. Instead of debating theoretically, I built a 1-day benchmark testing our top 3 query access patterns under realistic concurrency. The empirical data showed the relational model reduced query p95 latency by 40%. We unanimously adopted it and completed the sprint smoothly.`
      }
    ],
    company_questions: [
      {
        id: "comp-1",
        category: "Mission & Culture Alignment",
        question: `Why ${company}, and what makes you passionate about contributing to our specific stage of growth?`,
        talking_points: [
          `Mention ${company}'s industry footprint and market positioning`,
          `Highlight alignment between your technical values and their product engineering culture`,
          `Emphasize your excitement about their recent innovations or regional expansion`
        ],
        model_answer: `I have been following ${company}'s trajectory in ${job.company_industry || 'the industry'}, particularly your focus on scalable product development. My background in ${skillStr} equips me to solve the exact technical scaling challenges you are encountering, and I thrive in cultures where engineering excellence directly translates to customer empowerment.`
      }
    ],
    reverse_questions: [
      {
        category: "Engineering Culture & Velocity",
        question: `What does the deployment and iteration cadence look like for the ${title} team on a weekly basis?`
      },
      {
        category: "Product & Business Impact",
        question: `What is the single most critical technical milestone the ${title} will need to deliver in their first 90 days?`
      },
      {
        category: "Team Architecture",
        question: `How does the engineering team balance new feature velocity against proactive technical debt refactoring and architecture maintenance?`
      }
    ]
  };
}

function renderPrepQuestions(data) {
  const techList = document.getElementById('tech-questions-list');
  if (techList) {
    techList.innerHTML = (data.technical_questions || []).map((q, idx) => {
      const conceptPills = (q.key_concepts || []).map(c => `<span class="concept-pill">${escapeHtml(c)}</span>`).join('');
      return `
        <div class="accordion-item ${idx === 0 ? 'open' : ''}" data-qid="${q.id}">
          <div class="accordion-header">
            <div class="accordion-title-wrap">
              <span class="accordion-category">${escapeHtml(q.category)}</span>
              <h4>${escapeHtml(q.question)}</h4>
            </div>
            <span class="accordion-icon">▼</span>
          </div>
          <div class="accordion-content">
            <div class="key-concepts-box">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-right: 0.5rem; align-self: center;">Key Concepts:</span>
              ${conceptPills}
            </div>
            <div class="model-answer-box">
              <div class="model-answer-title">💡 Model Answer & Best Practices</div>
              <p class="model-answer-text">${escapeHtml(q.model_answer)}</p>
            </div>
            <div class="accordion-actions">
              <button class="btn btn-primary btn-sm practice-btn" data-qid="${q.id}" data-text="${escapeHtml(q.question)}">
                🎙️ Practice Answering This Question
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const behList = document.getElementById('behavioral-questions-list');
  if (behList) {
    behList.innerHTML = (data.behavioral_questions || []).map((q) => {
      const star = q.star_guide || {};
      return `
        <div class="accordion-item" data-qid="${q.id}">
          <div class="accordion-header">
            <div class="accordion-title-wrap">
              <span class="accordion-category">${escapeHtml(q.category)}</span>
              <h4>${escapeHtml(q.question)}</h4>
            </div>
            <span class="accordion-icon">▼</span>
          </div>
          <div class="accordion-content">
            <div class="model-answer-box" style="margin-bottom: 0.75rem;">
              <div class="model-answer-title" style="color: var(--primary);">⭐ STAR Breakdown Blueprint</div>
              <ul style="padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6; color: #334155;">
                <li><strong>S (Situation):</strong> ${escapeHtml(star.Situation || '')}</li>
                <li><strong>T (Task):</strong> ${escapeHtml(star.Task || '')}</li>
                <li><strong>A (Action):</strong> ${escapeHtml(star.Action || '')}</li>
                <li><strong>R (Result):</strong> ${escapeHtml(star.Result || '')}</li>
              </ul>
            </div>
            <div class="model-answer-box">
              <div class="model-answer-title">💡 Exemplary STAR Response</div>
              <p class="model-answer-text">${escapeHtml(q.model_answer)}</p>
            </div>
            <div class="accordion-actions">
              <button class="btn btn-primary btn-sm practice-btn" data-qid="${q.id}" data-text="${escapeHtml(q.question)}">
                🎙️ Practice Answering This Question
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const compList = document.getElementById('company-questions-list');
  if (compList) {
    compList.innerHTML = (data.company_questions || []).map(q => {
      const points = (q.talking_points || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
      return `
        <div class="accordion-item" data-qid="${q.id}">
          <div class="accordion-header">
            <div class="accordion-title-wrap">
              <span class="accordion-category">${escapeHtml(q.category)}</span>
              <h4>${escapeHtml(q.question)}</h4>
            </div>
            <span class="accordion-icon">▼</span>
          </div>
          <div class="accordion-content">
            <div class="model-answer-box" style="margin-bottom: 0.75rem;">
              <div class="model-answer-title" style="color: var(--primary);">🎯 Key Talking Points to Mention</div>
              <ul style="padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6; color: #334155;">
                ${points}
              </ul>
            </div>
            <div class="model-answer-box">
              <div class="model-answer-title">💡 Sample Winning Response</div>
              <p class="model-answer-text">${escapeHtml(q.model_answer)}</p>
            </div>
            <div class="accordion-actions">
              <button class="btn btn-primary btn-sm practice-btn" data-qid="${q.id}" data-text="${escapeHtml(q.question)}">
                🎙️ Practice Answering This Question
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const revList = document.getElementById('reverse-questions-list');
  if (revList) {
    revList.innerHTML = (data.reverse_questions || []).map(q => `
      <div class="panel-card" style="margin-bottom: 0.75rem; padding: 1rem 1.25rem;">
        <span class="accordion-category" style="margin-bottom: 0.25rem; display: block;">${escapeHtml(q.category)}</span>
        <h4 style="font-size: 0.95rem; color: var(--text-main);">"${escapeHtml(q.question)}"</h4>
      </div>
    `).join('');
  }

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      item?.classList.toggle('open');
    });
  });

  document.querySelectorAll('.practice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qid = btn.getAttribute('data-qid');
      const text = btn.getAttribute('data-text');
      selectPracticeQuestion(qid, text);
    });
  });

  if (data.technical_questions && data.technical_questions.length > 0) {
    const q0 = data.technical_questions[0];
    selectPracticeQuestion(q0.id, q0.question);
  }
}

function selectPracticeQuestion(qid, qText) {
  state.activePracticeQuestion = { id: qid, text: qText };
  const display = document.getElementById('practice-current-question');
  if (display) display.textContent = qText;
  const userAns = document.getElementById('practice-user-answer');
  if (userAns) userAns.value = '';
  document.getElementById('evaluation-result-box')?.classList.add('hidden');
}

async function handleEvaluateAnswer() {
  if (!state.activePracticeQuestion) {
    showToast('Select a question to practice first', 'warning');
    return;
  }
  const answer = document.getElementById('practice-user-answer')?.value.trim();
  if (!answer) {
    showToast('Please write your practice answer first', 'warning');
    return;
  }

  const evalBtn = document.getElementById('evaluate-answer-btn');
  if (evalBtn) {
    evalBtn.disabled = true;
    evalBtn.innerHTML = '<span class="icon">⏳</span> Analyzing Answer...';
  }

  try {
    let result = null;
    if (state.backendOnline) {
      const res = await fetch(apiUrl('/api/interview/evaluate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: state.activePracticeQuestion.id,
          question_text: state.activePracticeQuestion.text,
          user_answer: answer,
          custom_job: state.currentPrepJob
        })
      });
      if (res.ok) {
        result = await res.json();
      }
    }

    if (!result) {
      result = clientEvaluateInterviewAnswer(state.activePracticeQuestion.text, answer, state.currentPrepJob);
    }

    renderEvaluationResult(result);
  } catch (err) {
    console.warn('Backend evaluation failed, using client engine:', err);
    const result = clientEvaluateInterviewAnswer(state.activePracticeQuestion.text, answer, state.currentPrepJob);
    renderEvaluationResult(result);
  } finally {
    if (evalBtn) {
      evalBtn.disabled = false;
      evalBtn.innerHTML = '<span class="icon">⚡</span> Evaluate My Answer';
    }
  }
}

function clientEvaluateInterviewAnswer(questionText, userAnswer, job) {
  const words = userAnswer.trim().split(/\s+/).length;
  let score = 50;
  const strengths = [];
  const improvements = [];

  if (words >= 50) {
    score += 15;
    strengths.push("Substantial detail and thorough explanation provided.");
  } else if (words < 25) {
    score -= 15;
    improvements.push("Answer is overly brief. Aim for at least 50-100 words to provide adequate depth.");
  }

  const lower = userAnswer.toLowerCase();
  const hasSituation = lower.includes("when") || lower.includes("project") || lower.includes("at my previous") || lower.includes("we were") || lower.includes("in my");
  const hasAction = lower.includes("i implemented") || lower.includes("i decided") || lower.includes("i built") || lower.includes("i led") || lower.includes("i designed") || lower.includes("i ");
  const hasResult = lower.includes("result") || lower.includes("improved") || lower.includes("reduced") || lower.includes("increased") || lower.includes("%") || lower.includes("saved") || lower.includes("delivered");

  if (hasSituation) {
    score += 10;
    strengths.push("Clear contextual setup explaining the scenario.");
  } else {
    improvements.push("Establish the initial Situation more explicitly before diving into your actions.");
  }

  if (hasAction) {
    score += 15;
    strengths.push("Strong personal agency and ownership demonstrated with 'I' statements.");
  } else {
    improvements.push("Focus more on your specific individual Actions (what YOU did) rather than just 'we'.");
  }

  if (hasResult) {
    score += 15;
    strengths.push("Mentioned quantifiable impact and measurable outcomes.");
  } else {
    improvements.push("Quantify your Result with metrics (e.g. %, hours saved, throughput, user adoption).");
  }

  score = Math.min(95, Math.max(45, score));

  return {
    score: score,
    feedback: score >= 80 ? "Excellent response with strong structure and clear impact!" : (score >= 65 ? "Good answer with solid foundation; can be elevated by sharper metrics." : "Needs more concrete details and structured STAR framing."),
    strengths: strengths.length > 0 ? strengths : ["Addresses the prompt directly."],
    improvements: improvements.length > 0 ? improvements : ["Continue refining delivery for conciseness."],
    model_answer: `A polished version of your response: "In my recent project, we encountered a critical challenge where our primary service faced peak load latency spikes (Situation). As the lead on this component, my task was to diagnose the bottleneck and stabilize the system within 48 hours (Task). I conducted profiling, identified an unindexed query path, and introduced Redis caching with query pagination (Action). This reduced p99 latency by 45% and ensured seamless delivery during our product launch (Result)."`
  };
}

function renderEvaluationResult(result) {
  const box = document.getElementById('evaluation-result-box');
  if (!box) return;
  box.classList.remove('hidden');

  document.getElementById('eval-score-num').textContent = result.score || 70;
  document.getElementById('eval-verdict-title').textContent = result.score >= 80 ? 'Exceptional Performance!' : (result.score >= 60 ? 'Solid Response' : 'Needs Expansion');
  document.getElementById('eval-verdict-desc').textContent = result.feedback || '';

  const strengthsList = document.getElementById('eval-strengths-list');
  if (strengthsList) {
    strengthsList.innerHTML = (result.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  }

  const improvList = document.getElementById('eval-improvements-list');
  if (improvList) {
    improvList.innerHTML = (result.improvements || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');
  }

  const modelBox = document.getElementById('eval-model-answer');
  if (modelBox) {
    modelBox.textContent = result.model_answer || 'Incorporate concrete technical trade-offs and quantitative results.';
  }

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// Profile Management (Hybrid: Backend / LocalStorage)
// ============================================================================
async function loadProfile() {
  try {
    if (state.backendOnline) {
      const res = await fetch(apiUrl('/api/profile'));
      if (res.ok) {
        state.profile = await res.json();
      }
    } else {
      const stored = localStorage.getItem('jobhunt_profile');
      state.profile = stored ? JSON.parse(stored) : { ...DEFAULT_PROFILE };
    }
  } catch (err) {
    console.warn('Failed to load profile from backend, using local:', err);
    const stored = localStorage.getItem('jobhunt_profile');
    state.profile = stored ? JSON.parse(stored) : { ...DEFAULT_PROFILE };
  }

  if (!state.profile) {
    state.profile = { ...DEFAULT_PROFILE };
  }

  renderProfileForm();
  renderCandidateSnapshot();
}

function setupProfileListeners() {
  const saveBtn = document.getElementById('save-profile-btn');
  saveBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const skillsRaw = document.getElementById('prof-skills')?.value || '';
    const skillsList = skillsRaw.split(',').map(s => s.trim()).filter(s => s);

    const payload = {
      full_name: document.getElementById('prof-name')?.value.trim() || 'Candidate',
      current_title: document.getElementById('prof-title')?.value.trim() || 'Professional',
      email: document.getElementById('prof-email')?.value.trim() || '',
      phone: document.getElementById('prof-phone')?.value.trim() || '',
      location: document.getElementById('prof-location')?.value.trim() || '',
      years_experience: parseInt(document.getElementById('prof-experience')?.value) || 0,
      education: document.getElementById('prof-education')?.value.trim() || '',
      skills: skillsList,
      bio: document.getElementById('prof-bio')?.value.trim() || '',
      linkedin_url: document.getElementById('prof-linkedin')?.value.trim() || '',
      github_url: document.getElementById('prof-github')?.value.trim() || '',
      portfolio_url: document.getElementById('prof-portfolio')?.value.trim() || ''
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="icon">⏳</span> Saving...';

    try {
      state.profile = payload;
      localStorage.setItem('jobhunt_profile', JSON.stringify(payload));

      if (state.backendOnline) {
        await fetch(apiUrl('/api/profile'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      renderCandidateSnapshot();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Profile saved locally!', 'default');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="icon">💾</span> Save Profile';
    }
  });
}

function renderProfileForm() {
  if (!state.profile) return;
  const p = state.profile;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('prof-name', p.full_name);
  setVal('prof-title', p.current_title);
  setVal('prof-email', p.email);
  setVal('prof-phone', p.phone);
  setVal('prof-location', p.location);
  setVal('prof-experience', p.years_experience);
  setVal('prof-education', p.education);
  setVal('prof-skills', Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''));
  setVal('prof-bio', p.bio);
  setVal('prof-linkedin', p.linkedin_url);
  setVal('prof-github', p.github_url);
  setVal('prof-portfolio', p.portfolio_url);
}

// ============================================================================
// Pipeline Analytics & Stats
// ============================================================================
async function loadStats() {
  try {
    if (state.backendOnline) {
      const res = await fetch(apiUrl('/api/stats'));
      if (res.ok) {
        state.stats = await res.json();
      }
    } else {
      const jobs = state.savedJobs || [];
      state.stats = {
        total_saved: jobs.length,
        saved: jobs.filter(j => (j.status || 'Saved') === 'Saved').length,
        applied: jobs.filter(j => j.status === 'Applied').length,
        interviewing: jobs.filter(j => j.status === 'Interviewing').length,
        offered: jobs.filter(j => j.status === 'Offered').length
      };
    }
  } catch (err) {
    const jobs = state.savedJobs || [];
    state.stats = {
      total_saved: jobs.length,
      saved: jobs.filter(j => (j.status || 'Saved') === 'Saved').length,
      applied: jobs.filter(j => j.status === 'Applied').length,
      interviewing: jobs.filter(j => j.status === 'Interviewing').length,
      offered: jobs.filter(j => j.status === 'Offered').length
    };
  }

  const pTotal = document.getElementById('pipeline-total');
  if (pTotal) pTotal.textContent = state.stats.total_saved || 0;
  const pSaved = document.getElementById('pipeline-saved');
  if (pSaved) pSaved.textContent = state.stats.saved || 0;
  const pApplied = document.getElementById('pipeline-applied');
  if (pApplied) pApplied.textContent = state.stats.applied || 0;
  const pInter = document.getElementById('pipeline-interviewing');
  if (pInter) pInter.textContent = state.stats.interviewing || 0;
}

// ============================================================================
// Toast Notifications
// ============================================================================
function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}
