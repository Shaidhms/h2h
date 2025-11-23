// ==========================================
// Headlines to Hashtags - Main Application
// ==========================================

// ========== State Management ==========
const state = {
  news: [],
  selectedArticle: null,
  config: {
    category: 'general',
    country: 'us',
    platform: 'twitter',
    tone: 'informative',
  },
  systemReady: false
};

// ========== DOM Elements ==========
const elements = {
  // Layout
  heroSection: document.getElementById('hero-section'),
  appInterface: document.getElementById('app-interface'),
  startBtn: document.getElementById('start-btn'),

  // Modals
  onboardingModal: document.getElementById('onboarding-modal'),
  guideBtn: document.getElementById('guide-btn'),
  closeGuideBtn: document.getElementById('close-guide-btn'),
  closeModalIcon: document.querySelector('.close-modal'),

  // Controls
  categorySelect: document.getElementById('category-select'),
  countrySelect: document.getElementById('country-select'),
  platformSelect: document.getElementById('platform-select'),
  toneSelect: document.getElementById('tone-select'),

  // Tabs
  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanes: document.querySelectorAll('.tab-pane'),

  // Buttons
  fetchNewsBtn: document.getElementById('fetch-news-btn'),
  generateSeriesBtn: document.getElementById('generate-series-btn'),
  analyzeNewsBtn: document.getElementById('analyze-news-btn'),

  // Containers
  newsContainer: document.getElementById('news-container'),
  selectedArticleContainer: document.getElementById('selected-article-container'),
  seriesContainer: document.getElementById('series-container'),
  analyticsContainer: document.getElementById('analytics-container'),

  // Loading
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.querySelector('.loading-text'),
};

// ========== API Communication ==========
const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

// ========== Loading State ==========
function showLoading(message = 'PROCESSING DATA...') {
  if (elements.loadingText) elements.loadingText.textContent = message;
  elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
  elements.loadingOverlay.classList.remove('active');
}

// ========== System Initialization ==========
function initializeSystem() {
  // Hide hero, show app
  elements.heroSection.classList.add('hidden');
  elements.appInterface.classList.remove('hidden');

  // Show onboarding if first time (simulated)
  if (!localStorage.getItem('h2h_onboarding_seen')) {
    showOnboarding();
  }

  state.systemReady = true;
  playSound('startup');
}

function showOnboarding() {
  elements.onboardingModal.classList.add('active');
}

function hideOnboarding() {
  elements.onboardingModal.classList.remove('active');
  localStorage.setItem('h2h_onboarding_seen', 'true');
}

// ========== Tab Navigation ==========
function switchTab(tabName) {
  // Update tab buttons
  elements.tabButtons.forEach((btn) => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab panes
  elements.tabPanes.forEach((pane) => {
    if (pane.id === tabName) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  playSound('click');
}

// ========== News Fetching ==========
async function fetchNews() {
  showLoading('SCANNING GLOBAL FEEDS...');

  const params = new URLSearchParams({
    country: state.config.country,
    category: state.config.category,
    limit: '5',
  });

  const data = await apiCall(`/generate-news?${params}`);
  hideLoading();

  if (data.success) {
    state.news = data.articles;
    renderNews();
    updateButtonStates();
    showNotification(`ACQUIRED ${data.count} TARGETS`, 'success');
  } else {
    showNotification(`ERROR: ${data.error}`, 'error');
  }
}

function renderNews() {
  if (!state.news || state.news.length === 0) {
    elements.newsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-radar-fill empty-icon"></i>
        <p>SYSTEM READY. INITIATE SCAN.</p>
      </div>
    `;
    return;
  }

  elements.newsContainer.innerHTML = state.news
    .map(
      (article, index) => `
      <div class="news-card">
        <h3>${article.title || '(No title)'}</h3>
        <div class="news-meta">
          <span><i class="ri-newspaper-line"></i> ${article.source || 'Unknown'}</span>
          <span><i class="ri-calendar-line"></i> ${article.published_at || ''}</span>
        </div>
        <p class="news-description">${article.description || ''}</p>
        <div class="news-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-primary" onclick="selectArticle(${index})"><i class="ri-edit-circle-line"></i> SELECT TARGET</button>
          ${article.url ? `<a href="${article.url}" target="_blank" class="btn btn-secondary"><i class="ri-external-link-line"></i> SOURCE</a>` : ''}
        </div>
      </div>
    `
    )
    .join('');
}

// ========== Article Selection ==========
window.selectArticle = function (index) {
  state.selectedArticle = state.news[index];
  renderSelectedArticle();
  switchTab('create-content');
  showNotification('TARGET LOCKED. READY TO GENERATE.', 'success');
};

function renderSelectedArticle() {
  if (!state.selectedArticle) {
    elements.selectedArticleContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-cursor-line empty-icon"></i>
        <p>SELECT TARGET DATA FROM NEWS FEED.</p>
      </div>
    `;
    return;
  }

  const article = state.selectedArticle;
  elements.selectedArticleContainer.innerHTML = `
    <div class="content-card">
      <h4>${article.title || '(No title)'}</h4>
      <p><strong>Source:</strong> ${article.source || 'Unknown'}</p>
      <p style="opacity: 0.9;">${article.description || ''}</p>
    </div>
    <div style="margin-top: 1rem; padding: 1rem; border: 1px solid rgba(0,243,255,0.2); border-radius: 8px;">
      <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
        <i class="ri-settings-4-line"></i> CONFIGURATION
      </p>
      <p>
        Platform: <strong style="color: var(--neon-cyan)">${state.config.platform.toUpperCase()}</strong> • 
        Tone: <strong style="color: var(--neon-pink)">${state.config.tone.toUpperCase()}</strong>
      </p>
    </div>
    <button id="generate-post-btn" class="btn btn-primary btn-lg btn-glow" style="margin-top: 1.5rem; width: 100%;">
      <i class="ri-rocket-line"></i> INITIATE GENERATION
    </button>
    <div id="generated-content"></div>
  `;

  // Add event listener to generate button
  document.getElementById('generate-post-btn').addEventListener('click', generateSocialContent);
}

// ========== Social Content Generation ==========
async function generateSocialContent() {
  if (!state.selectedArticle) return;

  showLoading('GENERATING CONTENT...');

  const data = await apiCall('/create-social-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      article: state.selectedArticle,
      platform: state.config.platform,
      tone: state.config.tone,
      include_hashtags: true,
      include_link: true,
    }),
  });

  hideLoading();

  const contentDiv = document.getElementById('generated-content');
  if (data.success) {
    const platform = state.config.platform;
    const shareBtn = getShareButton(platform, data.content, state.selectedArticle?.url);

    contentDiv.innerHTML = `
      <div style="margin-top: 1.5rem; animation: slideUp 0.3s ease-out;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; color: var(--neon-cyan);"><i class="ri-check-double-line"></i> OUTPUT GENERATED</label>
          <div style="display: flex; gap: 0.5rem;">
            ${shareBtn}
            <button class="btn btn-secondary" onclick="copyToClipboard('${escapeHtml(data.content)}')"><i class="ri-file-copy-line"></i> COPY</button>
          </div>
        </div>
        <textarea class="text-output" readonly>${data.content}</textarea>
      </div>
    `;
    playSound('success');
  } else {
    contentDiv.innerHTML = `<p style="color: var(--error); margin-top: 1rem;">ERROR: ${data.error}</p>`;
    playSound('error');
  }
}

function getShareButton(platform, text, url) {
  const safeText = encodeURIComponent(text);
  let shareUrl = '';
  let icon = '';
  let label = `SHARE TO ${platform.toUpperCase()}`;
  let action = '';

  // Strategy:
  // Twitter: Native Intent (Best)
  // Others: Copy text to clipboard -> Open Platform (Most reliable for text content)

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${safeText}`;
      icon = 'ri-twitter-x-line';
      action = `window.open('${shareUrl}', '_blank')`;
      break;

    case 'linkedin':
      shareUrl = 'https://www.linkedin.com/feed/';
      icon = 'ri-linkedin-fill';
      label = 'COPY & OPEN LINKEDIN';
      action = `copyToClipboard('${escapeHtml(text)}'); setTimeout(() => window.open('${shareUrl}', '_blank'), 500)`;
      break;

    case 'facebook':
      shareUrl = 'https://www.facebook.com/';
      icon = 'ri-facebook-fill';
      label = 'COPY & OPEN FB';
      action = `copyToClipboard('${escapeHtml(text)}'); setTimeout(() => window.open('${shareUrl}', '_blank'), 500)`;
      break;

    case 'instagram':
      shareUrl = 'https://www.instagram.com/';
      icon = 'ri-instagram-line';
      label = 'COPY & OPEN INSTA';
      action = `copyToClipboard('${escapeHtml(text)}'); setTimeout(() => window.open('${shareUrl}', '_blank'), 500)`;
      break;

    case 'tiktok':
      shareUrl = 'https://www.tiktok.com/';
      icon = 'ri-tiktok-fill';
      label = 'COPY & OPEN TIKTOK';
      action = `copyToClipboard('${escapeHtml(text)}'); setTimeout(() => window.open('${shareUrl}', '_blank'), 500)`;
      break;

    default:
      return '';
  }

  return `<button class="btn btn-primary btn-glow" onclick="${action}"><i class="${icon}"></i> ${label}</button>`;
}

// ========== Content Series Generation ==========
async function generateSeries() {
  if (!state.news || state.news.length < 2) return;

  showLoading('BUILDING THREAD SEQUENCE...');

  const data = await apiCall('/create-content-series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: state.news.slice(0, 3),
      platform: state.config.platform,
      theme: 'Daily Update',
      tone: state.config.tone,
    }),
  });

  hideLoading();

  if (data.success) {
    elements.seriesContainer.innerHTML = `
      <div style="margin-top: 1rem; animation: slideUp 0.3s ease-out;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; color: var(--neon-cyan);"><i class="ri-stack-line"></i> SERIES OUTPUT</label>
          <button class="btn btn-secondary" onclick="copyToClipboard('${escapeHtml(data.series)}')"><i class="ri-file-copy-line"></i> COPY</button>
        </div>
        <textarea class="text-output" style="min-height: 320px;" readonly>${data.series}</textarea>
      </div>
    `;
    playSound('success');
  } else {
    elements.seriesContainer.innerHTML = `<p style="color: var(--error); margin-top: 1rem;">ERROR: ${data.error}</p>`;
    playSound('error');
  }
}

// ========== News Analysis ==========
async function analyzeNews() {
  if (!state.news || state.news.length === 0) return;

  showLoading('RUNNING STRATEGIC DIAGNOSTICS...');

  const data = await apiCall('/analyze-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: state.news,
    }),
  });

  hideLoading();

  if (data.success) {
    elements.analyticsContainer.innerHTML = `
      <div style="margin-top: 1rem; animation: slideUp 0.3s ease-out;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; color: var(--neon-cyan);"><i class="ri-pie-chart-2-line"></i> ANALYSIS REPORT</label>
          <button class="btn btn-secondary" onclick="copyToClipboard('${escapeHtml(data.analysis)}')"><i class="ri-file-copy-line"></i> COPY</button>
        </div>
        <textarea class="text-output" style="min-height: 320px;" readonly>${data.analysis}</textarea>
      </div>
    `;
    playSound('success');
  } else {
    elements.analyticsContainer.innerHTML = `<p style="color: var(--error); margin-top: 1rem;">ERROR: ${data.error}</p>`;
    playSound('error');
  }
}

// ========== Utility Functions ==========
function updateButtonStates() {
  const hasEnoughNews = state.news && state.news.length >= 2;
  const hasNews = state.news && state.news.length > 0;

  elements.generateSeriesBtn.disabled = !hasEnoughNews;
  elements.analyzeNewsBtn.disabled = !hasNews;

  if (!hasEnoughNews) {
    elements.seriesContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-database-2-line empty-icon"></i>
        <p>INSUFFICIENT DATA. FETCH 2+ ARTICLES.</p>
      </div>
    `;
  }

  if (!hasNews) {
    elements.analyticsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-line-chart-line empty-icon"></i>
        <p>NO DATA TO ANALYZE.</p>
      </div>
    `;
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const color = type === 'success' ? 'var(--neon-green)' : type === 'error' ? '#ff3333' : 'var(--neon-cyan)';

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: rgba(5, 5, 16, 0.95);
    color: ${color};
    border: 1px solid ${color};
    border-radius: 4px;
    box-shadow: 0 0 15px ${color}40;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    font-family: var(--font-tech);
    font-weight: 600;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const icon = type === 'success' ? '<i class="ri-check-line"></i>' : type === 'error' ? '<i class="ri-error-warning-line"></i>' : '<i class="ri-information-line"></i>';
  notification.innerHTML = `${icon} ${message}`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

window.copyToClipboard = function (text) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const cleanText = tempDiv.textContent || tempDiv.innerText;

  navigator.clipboard.writeText(cleanText).then(() => {
    showNotification('COPIED TO CLIPBOARD', 'success');
    playSound('click');
  }).catch(() => {
    showNotification('COPY FAILED', 'error');
  });
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// Simulated Sound Effects (Console logs for now, could add real audio later)
function playSound(type) {
  // In a real implementation, we would play audio files here
  // const audio = new Audio(`/sounds/${type}.mp3`);
  // audio.play().catch(e => console.log('Audio play failed', e));
  console.log(`🔊 Sound Effect: ${type}`);
}

// ========== Event Listeners ==========
function initEventListeners() {
  // Hero Button
  elements.startBtn.addEventListener('click', initializeSystem);

  // Onboarding
  elements.guideBtn.addEventListener('click', showOnboarding);
  elements.closeGuideBtn.addEventListener('click', hideOnboarding);
  if (elements.closeModalIcon) elements.closeModalIcon.addEventListener('click', hideOnboarding);

  // Configuration changes
  elements.categorySelect.addEventListener('change', (e) => {
    state.config.category = e.target.value;
    playSound('click');
  });

  // Custom Dropdowns Initialization
  const dropdowns = [
    { id: 'platform-custom-select', inputId: 'platform-select', stateKey: 'platform' },
    { id: 'category-custom-select', inputId: 'category-select', stateKey: 'category' },
    { id: 'country-custom-select', inputId: 'country-select', stateKey: 'country' },
    { id: 'tone-custom-select', inputId: 'tone-select', stateKey: 'tone' }
  ];

  dropdowns.forEach(dropdown => {
    const customSelect = document.getElementById(dropdown.id);
    if (!customSelect) return;

    const selectedDiv = customSelect.querySelector('.select-selected');
    const itemsDiv = customSelect.querySelector('.select-items');
    const hiddenInput = document.getElementById(dropdown.inputId);

    selectedDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns(customSelect);
      itemsDiv.classList.toggle('select-hide');
      selectedDiv.classList.toggle('select-arrow-active');
      playSound('click');
    });

    itemsDiv.querySelectorAll('div').forEach(item => {
      item.addEventListener('click', (e) => {
        const value = item.getAttribute('data-value');
        const html = item.innerHTML;

        // Update UI
        selectedDiv.innerHTML = html;
        itemsDiv.classList.add('select-hide');
        selectedDiv.classList.remove('select-arrow-active');

        // Update State
        state.config[dropdown.stateKey] = value;
        hiddenInput.value = value;

        // Trigger updates
        if (state.selectedArticle) renderSelectedArticle();
        playSound('click');
      });
    });
  });

  function closeAllDropdowns(exceptSelect) {
    dropdowns.forEach(dropdown => {
      const customSelect = document.getElementById(dropdown.id);
      if (customSelect === exceptSelect) return;

      const itemsDiv = customSelect.querySelector('.select-items');
      const selectedDiv = customSelect.querySelector('.select-selected');

      itemsDiv.classList.add('select-hide');
      selectedDiv.classList.remove('select-arrow-active');
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    closeAllDropdowns(null);
  });

  // Action buttons
  elements.fetchNewsBtn.addEventListener('click', fetchNews);
  elements.generateSeriesBtn.addEventListener('click', generateSeries);
  elements.analyzeNewsBtn.addEventListener('click', analyzeNews);
}

// ========== Animations CSS ==========
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ========== Initialize App ==========
function init() {
  initEventListeners();
  updateButtonStates();
  console.log('🚀 SYSTEM ONLINE: Headlines to Hashtags v2.0');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
