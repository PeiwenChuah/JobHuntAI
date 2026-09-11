/**
 * JobHuntAI Application Frontend Controller
 * - 100% Real-Time Live Job Search (LinkedIn & JobStreet)
 * - Zero mock jobs: Jobs are fetched live on demand when user searches
 * - Jobs are stored ONLY when user explicitly clicks "Save Job"
 * - Supports ALL roles (Software Engineer, Product Manager, Data Scientist, Accountant, etc.)
 * - Multi-country tag selection & Time filters (24h, 7d, 30d, any)
 */

// Application State
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
  selectedCountries: ['Malaysia'], // Default: Malaysia
  lastSearchQuery: '',
  stats: { saved: 0, applied: 0, interviewing: 0, total_saved: 0 }
};

// Flag helper
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

  renderCountryTags();
  await loadProfile();
  await loadSavedJobs();
  await loadStats();

  // Do NOT show default job! Keep search clean and ready for user input
  document.getElementById('job-search-input').value = '';
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
      const q = document.getElementById('job-search-input').value.trim();
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
    const q = document.getElementById('job-search-input').value.trim();
    if (q) performLiveSearch(q);
  }
}

function removeCountry(countryName) {
  state.selectedCountries = state.selectedCountries.filter(c => c !== countryName);
  renderCountryTags();
  const q = document.getElementById('job-search-input').value.trim();
  if (q) performLiveSearch(q);
}

function renderCountryTags() {
  const container = document.getElementById('country-tag-container');
  const input = document.getElementById('country-text-input');
  
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
// Live On-Demand Job Search (LinkedIn & JobStreet)
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

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) performLiveSearch(q);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.liveJobs = [];
    state.filteredJobs = [];
    state.lastSearchQuery = '';
    renderEmptyInitialState();
  });

  [workplaceSelect, expSelect, timeSelect].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        const q = searchInput.value.trim();
        if (q) performLiveSearch(q);
      });
    }
  });

  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      applyFiltersAndRender();
    });
  }

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
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

  document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const keyword = pill.getAttribute('data-keyword');
      document.querySelectorAll('.tag-pill').forEach(t => t.classList.remove('active'));
      pill.classList.add('active');
      searchInput.value = keyword;
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
    statusText.innerHTML = `Enter any job title above to fetch real-time jobs from <strong>LinkedIn</strong>, <strong>JobStreet</strong>, <strong>Remotive</strong>, <strong>Arbeitnow</strong>, and <strong>Web Gateways</strong>.`;
  }
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 16px; border: 1.5px dashed var(--border-color); box-shadow: var(--shadow-sm);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">💼</div>
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Ready to Search Real-Time Jobs Across the Web</h3>
      <p class="text-muted" style="max-width: 580px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.6;">
        Type any job title above (e.g., <strong>Data Scientist</strong>, <strong>Software Engineer</strong>, <strong>Product Manager</strong>, <strong>Accountant</strong>) and click <strong>Search Live Jobs</strong>. We fetch 100% real-time, verified postings on-demand from <strong>LinkedIn</strong>, <strong>JobStreet</strong>, <strong>Remotive</strong>, <strong>Arbeitnow</strong>, and <strong>Open Web Gateways</strong>.
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
  statusText.innerHTML = `Fetching live listings across the web for <strong>"${escapeHtml(keyword)}"</strong> in ${escapeHtml(countries)}...`;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="icon">⏳</span> <span class="btn-text">Searching Live...</span>`;

  try {
    const params = new URLSearchParams({ q: keyword, countries, time, workplace, experience, source });
    const res = await fetch(`/api/jobs/live-search?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    state.liveJobs = data.jobs || [];
    state.filteredJobs = [...state.liveJobs];
    state.displayedCount = 12;

    if (state.liveJobs.length > 0) {
      statusText.innerHTML = `Found <strong>${data.total}</strong> live active positions for <strong>"${escapeHtml(keyword)}"</strong> across ${escapeHtml(countries)} (LinkedIn, JobStreet, Remotive, Arbeitnow & Web).`;
    } else {
      statusText.innerHTML = `No live jobs found for <strong>"${escapeHtml(keyword)}"</strong> in ${escapeHtml(countries)}.`;
    }
    renderLiveJobsGrid();
  } catch (err) {
    console.error('Live search error:', err);
    showToast('Failed to fetch live jobs. Check connection.', 'danger');
    statusText.innerHTML = `<span style="color: var(--danger);">Error fetching live jobs. Please try again.</span>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span class="icon">⚡</span> <span class="btn-text">Search Live Jobs</span>`;
  }
}

// ============================================================================
// Render Live Jobs Grid (With 12-Card Pagination & All Sources)
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

  // Update load more button
  if (loadMoreContainer) {
    if (total > state.displayedCount) {
      loadMoreContainer.classList.remove('hidden');
      if (showingCount) showingCount.textContent = jobsToDisplay.length;
      if (totalCount) totalCount.textContent = total;
    } else {
      loadMoreContainer.classList.add('hidden');
    }
  }

  container.innerHTML = jobsToDisplay.map((job, idx) => {
    const isSaved = state.savedJobs.some(sj => sj.application_url === job.application_url);
    const saveBtnText = isSaved ? '⭐ Saved' : '☆ Save';
    const saveBtnClass = isSaved ? 'btn-saved-active' : 'btn-outline';

    const flag = getCountryFlag(job.company_country);
    const s = (job.source || '').toLowerCase();
    let applyText = '💼 Apply on LinkedIn';
    let applyClass = 'btn-apply-direct';

    if (s.includes('jobstreet')) {
      const isGateway = (job.title || '').toLowerCase().startsWith('explore all');
      applyText = isGateway ? '🏢 Browse on JobStreet' : '🏢 Apply on JobStreet';
      applyClass = 'btn-jobstreet';
    } else if (s.includes('remotive')) {
      applyText = '⚡ Apply on Remotive';
      applyClass = 'btn-remotive';
    } else if (s.includes('arbeitnow')) {
      applyText = '🌍 Apply on Arbeitnow';
      applyClass = 'btn-arbeitnow';
    } else if (s.includes('google') || s.includes('indeed') || s.includes('glassdoor') || s.includes('web')) {
      applyText = `🌐 View on ${escapeHtml(job.source || 'Web')}`;
      applyClass = 'btn-web';
    }

    const skillsList = ensureArray(job.skills);
    const skillsHtml = skillsList.slice(0, 4).map(sk => 
      `<span class="skill-tag">${escapeHtml(sk)}</span>`
    ).join('');

    return `
      <div class="job-card" data-idx="${idx}">
        <div class="job-card-header">
          <div class="card-top-meta">
            <span class="company-title">${escapeHtml(job.company)}</span>
            <div style="display: flex; gap: 0.35rem; align-items: center;">
              ${getSourceBadgeHtml(job.source)}
              <button class="btn btn-sm ${saveBtnClass} quick-save-btn" data-idx="${idx}" title="Save job to my tracker">
                ${saveBtnText}
              </button>
            </div>
          </div>

          <h3 class="job-role-title">${escapeHtml(job.title)}</h3>
          
          <div class="company-details-badges">
            <span class="badge badge-country">${flag} ${escapeHtml(job.company_country)}</span>
            <span class="badge badge-size">👥 ${escapeHtml(job.company_size || '1,000+')}</span>
            <span class="badge badge-workplace">📍 ${escapeHtml(job.workplace_type)}</span>
            ${job.posted_at ? `<span class="badge badge-time">🕒 ${escapeHtml(job.posted_at)}</span>` : ''}
          </div>

          <div class="card-salary-loc">
            <span>📍 ${escapeHtml(job.location)}</span>
          </div>

          <p class="card-summary">${escapeHtml(job.summary || job.description)}</p>

          <div class="card-skills-row">
            ${skillsHtml}
          </div>
        </div>

        <div class="job-card-actions">
          <button class="btn btn-secondary btn-sm live-view-btn" data-idx="${idx}">
            View Details
          </button>
          <div class="action-buttons-group">
            <button class="btn btn-outline btn-sm live-cl-btn" data-idx="${idx}" title="Draft Cover Letter">
              ✍️ Cover Letter
            </button>
            <button class="btn btn-outline btn-sm live-prep-btn" data-idx="${idx}" title="Prepare Interview">
              🎯 Prep
            </button>
            <a href="${escapeHtml(job.application_url)}" target="_blank" rel="noopener" class="btn btn-sm ${applyClass}">
              ${applyText}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  container.querySelectorAll('.quick-save-btn').forEach(btn => {
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
// Job Saving / Bookmarking
// ============================================================================
async function toggleSaveJob(job, btnElement = null) {
  try {
    const res = await fetch('/api/jobs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    if (res.ok) {
      const data = await res.json();
      job.id = data.id;
      showToast(`Saved "${job.title}" to My Tracker!`, 'success');
      if (btnElement) {
        btnElement.textContent = '⭐ Saved';
        btnElement.className = 'btn btn-sm btn-saved-active quick-save-btn';
      }
      await loadSavedJobs();
      await loadStats();
    }
  } catch (err) {
    console.error('Save error:', err);
    showToast('Failed to save job', 'danger');
  }
}

async function loadSavedJobs() {
  try {
    const res = await fetch('/api/jobs/saved');
    const data = await res.json();
    state.savedJobs = data.jobs || [];
    document.getElementById('nav-saved-count').textContent = state.savedJobs.length;
    document.getElementById('stat-saved-count').textContent = state.savedJobs.length;
  } catch (err) {
    console.error('Error loading saved jobs:', err);
  }
}

// ============================================================================
// Job Detail Modal (Works for both Live and Saved jobs)
// ============================================================================
function openLiveJobModal(job) {
  state.activeJobDetail = job;

  document.getElementById('modal-job-title').textContent = job.title;
  document.getElementById('modal-job-company').textContent = job.company;
  
  const flag = getCountryFlag(job.company_country);
  document.getElementById('modal-country-badge').textContent = `${flag} ${job.company_country}`;
  document.getElementById('modal-size-badge').textContent = `👥 ${job.company_size || '1,000+'}`;
  document.getElementById('modal-source-badge').textContent = `💼 ${job.source || 'LinkedIn'}`;
  document.getElementById('modal-workplace-badge').textContent = `🏢 ${job.workplace_type}`;

  document.getElementById('modal-spec-country').textContent = `${flag} ${job.company_country}`;
  document.getElementById('modal-spec-size').textContent = job.company_size || '1,000+';
  document.getElementById('modal-spec-industry').textContent = job.company_industry || 'Information Technology';
  document.getElementById('modal-spec-salary').textContent = job.salary_range || 'Competitive Market Rate';
  document.getElementById('modal-spec-location').textContent = job.location;
  document.getElementById('modal-spec-posted').textContent = job.posted_at || 'Recently';

  document.getElementById('modal-job-desc').textContent = job.description;

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
  const isSaved = state.savedJobs.some(sj => sj.application_url === job.application_url);
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
  document.getElementById('close-detail-modal').addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  document.getElementById('modal-save-btn').addEventListener('click', async () => {
    if (!state.activeJobDetail) return;
    await toggleSaveJob(state.activeJobDetail);
    document.getElementById('modal-save-btn').textContent = '⭐ Already in My Tracker';
  });

  document.getElementById('modal-draft-cl-btn').addEventListener('click', () => {
    if (!state.activeJobDetail) return;
    detailModal.classList.add('hidden');
    goToCoverLetterWithJob(state.activeJobDetail);
  });

  document.getElementById('modal-prep-btn').addEventListener('click', () => {
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

  jobSelect.addEventListener('change', () => {
    const jobId = parseInt(jobSelect.value);
    const job = state.savedJobs.find(j => j.id === jobId);
    if (job) renderCoverLetterJobPreview(job);
  });

  genBtn.addEventListener('click', async () => {
    const jobId = parseInt(jobSelect.value);
    let jobPayload = null;

    if (jobId) {
      jobPayload = state.savedJobs.find(j => j.id === jobId);
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
      const res = await fetch('/api/cover-letter/generate', {
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
        textarea.value = data.cover_letter;
        updateWordCount(data.cover_letter);
        document.getElementById('cl-status-badge').textContent = 'Generated';
        showToast('Personalized cover letter generated!', 'success');
      } else {
        showToast(data.error || 'Failed to generate cover letter', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with generation engine', 'danger');
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = '<span class="icon">✨</span> Generate Cover Letter';
    }
  });

  textarea.addEventListener('input', () => {
    updateWordCount(textarea.value);
  });

  copyBtn.addEventListener('click', () => {
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(() => {
      showToast('Cover letter copied to clipboard!', 'success');
    });
  });

  downloadBtn.addEventListener('click', () => {
    if (!textarea.value) return;
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded text file', 'success');
  });

  printBtn.addEventListener('click', () => {
    if (!textarea.value) return;
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
  document.getElementById('cl-word-count').textContent = `${words} words`;
}

function populateCoverLetterJobSelect() {
  const select = document.getElementById('cl-job-select');
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose from Saved Jobs --</option>' + 
    state.savedJobs.map(j => `<option value="${j.id}">${escapeHtml(j.company)} — ${escapeHtml(j.title)} (${escapeHtml(j.company_country)})</option>`).join('');
  if (currentVal) select.value = currentVal;
}

function renderCoverLetterJobPreview(job) {
  const previewBox = document.getElementById('cl-job-preview-box');
  if (!job) {
    previewBox.classList.add('hidden');
    return;
  }
  previewBox.classList.remove('hidden');
  document.getElementById('cl-preview-title').textContent = job.title;
  document.getElementById('cl-preview-company').textContent = job.company;
  const flag = getCountryFlag(job.company_country);
  document.getElementById('cl-preview-country').textContent = `${flag} ${job.company_country}`;
  document.getElementById('cl-preview-source').innerHTML = getSourceBadgeHtml(job.source);

  // Set smart contextual placeholders for optional inputs
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

// ============================================================================
// Interview Prep Coach
// ============================================================================
function setupInterviewPrepListeners() {
  const prepSelect = document.getElementById('prep-job-select');
  prepSelect.addEventListener('change', () => {
    const jobId = parseInt(prepSelect.value);
    const job = state.savedJobs.find(j => j.id === jobId);
    if (job) loadInterviewPrepForJob(job);
  });

  document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.getAttribute('data-subtab');
      document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(targetSub).classList.add('active');
    });
  });

  const evalBtn = document.getElementById('evaluate-answer-btn');
  evalBtn.addEventListener('click', handleEvaluateAnswer);
}

function populatePrepJobSelect() {
  const select = document.getElementById('prep-job-select');
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
  badge.classList.remove('hidden');
  document.getElementById('prep-badge-title').textContent = job.title;
  document.getElementById('prep-badge-company').textContent = job.company;

  try {
    const res = await fetch('/api/interview/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_job: job })
    });
    const data = await res.json();
    state.currentPrepData = data;
    renderPrepQuestions(data);
  } catch (err) {
    console.error('Error fetching prep data:', err);
    showToast('Failed to load interview prep content', 'danger');
  }
}

function renderPrepQuestions(data) {
  // 1. Technical Questions
  const techList = document.getElementById('tech-questions-list');
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

  // 2. Behavioral Questions (STAR)
  const behList = document.getElementById('behavioral-questions-list');
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

  // 3. Company Questions
  const compList = document.getElementById('company-questions-list');
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

  // 4. Reverse Questions
  const revList = document.getElementById('reverse-questions-list');
  revList.innerHTML = (data.reverse_questions || []).map(q => `
    <div class="panel-card" style="margin-bottom: 0.75rem; padding: 1rem 1.25rem;">
      <span class="accordion-category" style="margin-bottom: 0.25rem; display: block;">${escapeHtml(q.category)}</span>
      <h4 style="font-size: 0.95rem; color: var(--text-main);">"${escapeHtml(q.question)}"</h4>
    </div>
  `).join('');

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      item.classList.toggle('open');
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
  display.textContent = qText;
  document.getElementById('practice-user-answer').value = '';
  document.getElementById('evaluation-result-box').classList.add('hidden');
}

async function handleEvaluateAnswer() {
  if (!state.activePracticeQuestion) {
    showToast('Select a question to practice first', 'warning');
    return;
  }
  const answer = document.getElementById('practice-user-answer').value.trim();
  if (!answer) {
    showToast('Please write your practice answer first', 'warning');
    return;
  }

  const evalBtn = document.getElementById('evaluate-answer-btn');
  evalBtn.disabled = true;
  evalBtn.innerHTML = '<span class="icon">⏳</span> Analyzing Answer...';

  try {
    const res = await fetch('/api/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: state.activePracticeQuestion.id,
        question_text: state.activePracticeQuestion.text,
        user_answer: answer,
        custom_job: state.currentPrepJob
      })
    });
    const result = await res.json();
    renderEvaluationResult(result);
  } catch (err) {
    console.error('Evaluation error:', err);
    showToast('Failed to evaluate answer', 'danger');
  } finally {
    evalBtn.disabled = false;
    evalBtn.innerHTML = '<span class="icon">⚡</span> Evaluate My Answer';
  }
}

function renderEvaluationResult(result) {
  const box = document.getElementById('evaluation-result-box');
  box.classList.remove('hidden');

  document.getElementById('eval-score-num').textContent = result.score || 70;
  document.getElementById('eval-verdict-title').textContent = result.score >= 80 ? 'Exceptional Performance!' : (result.score >= 60 ? 'Solid Response' : 'Needs Expansion');
  document.getElementById('eval-verdict-desc').textContent = result.feedback || '';

  const strengthsList = document.getElementById('eval-strengths-list');
  strengthsList.innerHTML = (result.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');

  const improvList = document.getElementById('eval-improvements-list');
  improvList.innerHTML = (result.improvements || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');

  const modelBox = document.getElementById('eval-model-answer');
  modelBox.textContent = result.model_answer || 'Incorporate concrete technical trade-offs and quantitative results.';

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// Application Tracker (Kanban for Saved Jobs)
// ============================================================================
function renderKanban() {
  const cols = {
    'Saved': document.getElementById('col-saved-cards'),
    'Applied': document.getElementById('col-applied-cards'),
    'Interviewing': document.getElementById('col-interviewing-cards'),
    'Offered': document.getElementById('col-offered-cards')
  };

  const counts = {
    'Saved': 0, 'Applied': 0, 'Interviewing': 0, 'Offered': 0
  };

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
    if (status === 'Rejected') status = 'Offered';

    if (cols[status]) {
      counts[status]++;
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

  document.getElementById('count-col-saved').textContent = counts['Saved'];
  document.getElementById('count-col-applied').textContent = counts['Applied'];
  document.getElementById('count-col-interviewing').textContent = counts['Interviewing'];
  document.getElementById('count-col-offered').textContent = counts['Offered'];

  document.querySelectorAll('.kanban-status-select').forEach(select => {
    select.addEventListener('change', async () => {
      const jobId = parseInt(select.getAttribute('data-id'));
      const newStatus = select.value;
      await updateSavedJobStatus(jobId, newStatus);
    });
  });

  document.querySelectorAll('.kanban-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = parseInt(btn.getAttribute('data-id'));
      const job = state.savedJobs.find(j => j.id === jobId);
      if (job) openLiveJobModal(job);
    });
  });

  document.querySelectorAll('.kanban-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const jobId = parseInt(btn.getAttribute('data-id'));
      await deleteSavedJob(jobId);
    });
  });
}

async function updateSavedJobStatus(jobId, newStatus) {
  try {
    const res = await fetch(`/api/jobs/saved/${jobId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const job = state.savedJobs.find(j => j.id === jobId);
      if (job) job.status = newStatus;
      await loadStats();
      renderKanban();
      showToast(`Status updated to: ${newStatus}`, 'success');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteSavedJob(jobId) {
  try {
    const res = await fetch(`/api/jobs/saved/${jobId}`, { method: 'DELETE' });
    if (res.ok) {
      state.savedJobs = state.savedJobs.filter(j => j.id !== jobId);
      await loadStats();
      renderKanban();
      showToast('Job removed from tracker', 'default');
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// Profile Management
// ============================================================================
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    state.profile = data;
    renderProfileForm();
    renderCandidateSnapshot();
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

function setupProfileListeners() {
  const saveBtn = document.getElementById('save-profile-btn');
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const skillsRaw = document.getElementById('prof-skills').value;
    const skillsList = skillsRaw.split(',').map(s => s.trim()).filter(s => s);

    const payload = {
      full_name: document.getElementById('prof-name').value.trim(),
      current_title: document.getElementById('prof-title').value.trim(),
      email: document.getElementById('prof-email').value.trim(),
      phone: document.getElementById('prof-phone').value.trim(),
      location: document.getElementById('prof-location').value.trim(),
      years_experience: parseInt(document.getElementById('prof-experience').value) || 0,
      education: document.getElementById('prof-education').value.trim(),
      skills: skillsList,
      bio: document.getElementById('prof-bio').value.trim(),
      linkedin_url: document.getElementById('prof-linkedin').value.trim(),
      github_url: document.getElementById('prof-github').value.trim(),
      portfolio_url: document.getElementById('prof-portfolio').value.trim()
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="icon">⏳</span> Saving...';

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        state.profile = payload;
        renderCandidateSnapshot();
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving profile', 'danger');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="icon">💾</span> Save Profile';
    }
  });
}

function renderProfileForm() {
  if (!state.profile) return;
  const p = state.profile;
  document.getElementById('prof-name').value = p.full_name || '';
  document.getElementById('prof-title').value = p.current_title || '';
  document.getElementById('prof-email').value = p.email || '';
  document.getElementById('prof-phone').value = p.phone || '';
  document.getElementById('prof-location').value = p.location || '';
  document.getElementById('prof-experience').value = p.years_experience || 0;
  document.getElementById('prof-education').value = p.education || '';
  document.getElementById('prof-skills').value = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || '');
  document.getElementById('prof-bio').value = p.bio || '';
  document.getElementById('prof-linkedin').value = p.linkedin_url || '';
  document.getElementById('prof-github').value = p.github_url || '';
  document.getElementById('prof-portfolio').value = p.portfolio_url || '';
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    state.stats = data;

    const pTotal = document.getElementById('pipeline-total');
    if (pTotal) pTotal.textContent = data.total_saved || 0;
    const pSaved = document.getElementById('pipeline-saved');
    if (pSaved) pSaved.textContent = data.saved || 0;
    const pApplied = document.getElementById('pipeline-applied');
    if (pApplied) pApplied.textContent = data.applied || 0;
    const pInter = document.getElementById('pipeline-interviewing');
    if (pInter) pInter.textContent = data.interviewing || 0;
  } catch (err) {
    console.error(err);
  }
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
