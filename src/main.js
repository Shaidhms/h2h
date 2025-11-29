// ==========================================
// Headlines to Hashtags - Main Application
// ==========================================

// ========== State Management ==========
const state = {
  news: [],
  selectedArticle: null,
  contentType: 'news', // 'news' | 'quotes' | 'ai'
  config: {
    category: 'general',
    country: 'us',
    platform: 'twitter',
    tone: 'informative',
    bookSource: 'think-grow-rich',
    aiSource: 'openai',
  },
  systemReady: false,
  seriesSelection: new Set(), // Track selected article indices
  generatedContent: '', // Store generated social media text
  generatedImageUrl: null // Store generated image URL
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
  analyzeNewsBtn: document.getElementById('analyze-news-btn'),

  // Containers
  newsContainer: document.getElementById('news-container'),
  selectedArticleContainer: document.getElementById('selected-article-container'),
  seriesContainer: document.getElementById('series-container'),
  analyticsContainer: document.getElementById('analytics-container'),

  // Loading
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.querySelector('.loading-text'),

  // Mobile Sidebar
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  sidebar: document.querySelector('.sidebar'),
  sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
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
window.switchTab = function (tabName) {
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

// ========== Content Type Switching ==========
function switchContentType(type) {
  state.contentType = type;

  // Hide all config sections
  document.getElementById('news-config').classList.add('hidden');
  document.getElementById('quotes-config').classList.add('hidden');
  document.getElementById('ai-config').classList.add('hidden');

  // Show selected config section
  if (type === 'news') {
    document.getElementById('news-config').classList.remove('hidden');
  } else if (type === 'quotes') {
    document.getElementById('quotes-config').classList.remove('hidden');
  } else if (type === 'ai') {
    document.getElementById('ai-config').classList.remove('hidden');
  }

  playSound('click');
}

// ========== Content Fetching (News/Quotes/AI) ==========
async function fetchNews() {
  let loadingMessage, endpoint, params;

  // Branch based on content type
  switch (state.contentType) {
    case 'news':
      loadingMessage = 'SCANNING GLOBAL FEEDS...';
      endpoint = '/generate-news';
      params = new URLSearchParams({
        country: state.config.country,
        category: state.config.category,
        limit: '5',
      });
      break;

    case 'quotes':
      loadingMessage = 'EXTRACTING WISDOM...';
      endpoint = '/generate-quotes';
      params = new URLSearchParams({
        book: state.config.bookSource,
        limit: '5',
      });
      break;

    case 'ai':
      loadingMessage = 'SCANNING AI FEEDS...';
      endpoint = '/generate-ai-content';
      params = new URLSearchParams({
        source: state.config.aiSource,
        limit: '5',
      });
      break;
  }

  showLoading(loadingMessage);
  const data = await apiCall(`${endpoint}?${params}`);
  hideLoading();

  if (data.success) {
    state.news = data.articles;
    state.seriesSelection.clear(); // Clear series selection when fetching new content
    renderNews();
    updateButtonStates();

    // Reset series and analytics containers
    elements.seriesContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-database-2-line empty-icon"></i>
        <p>SELECT AT LEAST 2 ARTICLES TO GENERATE SERIES.</p>
        <button onclick="switchTab('fetch-news')" class="btn btn-primary" style="margin-top: 1rem;"><i class="ri-radar-line"></i> GO TO NEWS FEED</button>
      </div>
    `;
    elements.analyticsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-line-chart-line empty-icon"></i>
        <p>NO DATA TO ANALYZE. SCAN FOR NEWS FIRST.</p>
        <button onclick="switchTab('fetch-news')" class="btn btn-primary" style="margin-top: 1rem;"><i class="ri-radar-line"></i> GO TO NEWS FEED</button>
      </div>
    `;

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
      (article, index) => {
        const isSelected = state.seriesSelection.has(index);
        const seriesBtnClass = isSelected ? 'btn-primary' : 'btn-secondary';
        const seriesBtnIcon = isSelected ? 'ri-checkbox-circle-line' : 'ri-add-circle-line';
        const seriesBtnText = isSelected ? 'ADDED' : 'ADD TO SERIES';

        return `
      <div class="news-card ${isSelected ? 'selected-for-series' : ''}">
        <h3>${article.title || '(No title)'}</h3>
        <div class="news-meta">
          <span><i class="ri-newspaper-line"></i> ${article.source || 'Unknown'}</span>
          <span><i class="ri-calendar-line"></i> ${article.published_at || ''}</span>
        </div>
        <p class="news-description">${article.description || ''}</p>
        <div class="news-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="selectArticle(${index})"><i class="ri-edit-circle-line"></i> SELECT TARGET</button>
          <button class="btn ${seriesBtnClass}" onclick="toggleSeriesSelection(${index})"><i class="${seriesBtnIcon}"></i> ${seriesBtnText}</button>
          ${article.url ? `<a href="${article.url}" target="_blank" class="btn btn-secondary"><i class="ri-external-link-line"></i> SOURCE</a>` : ''}
        </div>
      </div>
    `;
      }
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

window.toggleSeriesSelection = function (index) {
  if (state.seriesSelection.has(index)) {
    state.seriesSelection.delete(index);
  } else {
    state.seriesSelection.add(index);
  }
  renderNews(); // Re-render to update button states
  updateButtonStates();
  playSound('click');
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
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <h4 style="margin-bottom: 0;">${article.title || '(No title)'}</h4>
        <button onclick="switchTab('fetch-news')" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"><i class="ri-arrow-left-line"></i> BACK</button>
      </div>
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

    contentDiv.innerHTML = `
      <div style="margin-top: 1.5rem; animation: slideUp 0.3s ease-out;">
        <div style="display: flex; justify-content: space-between; align-items:flex-start; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; color: var(--neon-cyan);"><i class="ri-check-double-line"></i> OUTPUT GENERATED</label>
          <div style="display: flex; gap: 0.5rem;">
            <button id="share-btn-generated" class="btn btn-primary btn-glow"><i class="ri-twitter-x-line"></i> ${getShareButtonLabel(platform)}</button>
            <button id="copy-btn-generated" class="btn btn-secondary"><i class="ri-file-copy-line"></i> COPY</button>
          </div>
        </div>
        <textarea class="text-output" readonly>${data.content}</textarea>
        
        <!-- Image Generation Section -->
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <button id="generate-image-btn" class="btn btn-primary" style="width: 100%;"><i class="ri-image-add-line"></i> GENERATE AI IMAGE</button>
          <div id="generated-image-container" style="margin-top: 1rem;"></div>
        </div>
      </div>
    `;

    // Store generated content for later use
    state.generatedContent = data.content;

    // Add event listeners to the buttons
    const copyBtn = document.getElementById('copy-btn-generated');
    const shareBtn = document.getElementById('share-btn-generated');
    const generateImageBtn = document.getElementById('generate-image-btn');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(data.content);
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        handleShare(platform, data.content, state.selectedArticle?.url, state.generatedImageUrl);
      });
    }

    if (generateImageBtn) {
      generateImageBtn.addEventListener('click', () => {
        generateImage(state.selectedArticle);
      });
    }

    playSound('success');
  } else {
    contentDiv.innerHTML = `<p style="color: var(--error); margin-top: 1rem;">ERROR: ${data.error}</p>`;
    playSound('error');
  }
}

function getShareButtonLabel(platform) {
  switch (platform) {
    case 'twitter': return 'POST TO X';
    case 'linkedin': return 'POST TO LINKEDIN';
    case 'instagram': return 'POST TO INSTAGRAM';
    case 'facebook': return 'POST TO FACEBOOK';
    default: return 'SHARE';
  }
}

async function handleShare(platform, text, url, imageUrl) {
  // Try Web Share API first (Mobile/Modern Browsers)
  if (navigator.share && imageUrl) {
    try {
      // Fetch image blob
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      const blob = await response.blob();
      const file = new File([blob], 'social-post.png', { type: 'image/png' });

      await navigator.share({
        title: 'Shared via Headlines to Hashtags',
        text: text,
        files: [file],
        url: url
      });
      showNotification('SHARED SUCCESSFULLY', 'success');
      return;
    } catch (err) {
      console.log('Web Share API failed, falling back to clipboard/download:', err);
    }
  }

  // Fallback: Copy text + Download image (if exists)
  copyToClipboard(text);

  if (imageUrl) {
    const link = document.createElement('a');
    link.href = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    link.download = 'social-post.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('TEXT COPIED & IMAGE DOWNLOADED', 'success');
  } else {
    showNotification('CONTENT COPIED TO CLIPBOARD', 'success');
  }

  // Open platform specific share URL (Text only)
  let shareUrl = '';
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url || '');

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      break;
    case 'instagram':
      // Instagram doesn't have a web share intent, so we rely on the copy/download fallback
      if (!imageUrl) showNotification('OPEN INSTAGRAM TO PASTE', 'info');
      return;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank');
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
window.generateSeries = async function () {
  // Use selected articles if available, otherwise don't proceed
  if (state.seriesSelection.size < 2) {
    showNotification('SELECT AT LEAST 2 ARTICLES FOR SERIES', 'error');
    return;
  }

  showLoading('BUILDING THREAD SEQUENCE...');

  const selectedArticles = Array.from(state.seriesSelection).map(i => state.news[i]);

  const data = await apiCall('/create-content-series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: selectedArticles,
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

// ========== Image Generation & Social Card ==========
async function generateImage(article) {
  const container = document.getElementById('generated-image-container');
  const btn = document.getElementById('generate-image-btn');

  if (btn) btn.disabled = true;
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
      <div class="loader"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">GENERATING VISUALS via DALL-E 3...</p>
    </div>
  `;

  const data = await apiCall('/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ article }),
  });

  if (btn) btn.disabled = false;

  if (data.success) {
    state.generatedImageUrl = data.imageUrl;

    container.innerHTML = `
      <div style="animation: fadeIn 0.5s ease-out;">
        <div style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--neon-cyan); box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);">
          <img src="${data.imageUrl}" alt="Generated Image" style="width: 100%; display: block;">
        </div>
        
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="create-card-btn" class="btn btn-primary btn-glow" style="flex: 1;">
            <i class="ri-layout-masonry-line"></i> CREATE SOCIAL CARD
          </button>
          <a href="${data.imageUrl}" download="generated-image.png" target="_blank" class="btn btn-secondary" style="flex: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">
            <i class="ri-download-line"></i> DOWNLOAD IMAGE
          </a>
        </div>
        
        <div id="card-preview-container" style="margin-top: 1rem; display: none;">
          <label style="font-weight: 600; color: var(--neon-cyan); display: block; margin-bottom: 0.5rem;">
            <i class="ri-image-edit-line"></i> CARD PREVIEW
          </label>
          <canvas id="social-card-canvas" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"></canvas>
          <button id="download-card-btn" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
            <i class="ri-download-cloud-line"></i> DOWNLOAD CARD
          </button>
        </div>
      </div>
    `;

    // Add event listener for card creation
    document.getElementById('create-card-btn').addEventListener('click', () => {
      createSocialCard(data.imageUrl, state.generatedContent);
    });

    playSound('success');
  } else {
    container.innerHTML = `<p style="color: var(--error); padding: 1rem; text-align: center;">ERROR: ${data.error}</p>`;
    playSound('error');
  }
}

async function createSocialCard(imageUrl, text) {
  const container = document.getElementById('card-preview-container');
  const canvas = document.getElementById('social-card-canvas');
  const ctx = canvas.getContext('2d');
  const downloadBtn = document.getElementById('download-card-btn');

  container.style.display = 'block';

  // Set canvas dimensions (Instagram Square 1080x1080)
  canvas.width = 1080;
  canvas.height = 1080;

  // Load image via proxy to avoid CORS issues
  const img = new Image();
  img.crossOrigin = "Anonymous";
  // Use proxy endpoint
  img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

  img.onload = () => {
    // Draw image
    ctx.drawImage(img, 0, 0, 1080, 1080);

    // Add dark gradient overlay for text readability
    const gradient = ctx.createLinearGradient(0, 500, 0, 1080);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.4, "rgba(0,0,0,0.7)");
    gradient.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Add border
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 1080, 1080);

    // Add text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Wrap text
    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = 900;
    const lineHeight = 60;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw text lines
    const startY = 1080 - (lines.length * lineHeight) - 100;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 540, startY + (i * lineHeight));
    }

    // Add branding
    ctx.font = "30px 'Courier New', monospace";
    ctx.fillStyle = "#00f3ff";
    ctx.fillText("HEADLINES TO HASHTAGS", 540, 1030);

    // Setup download button
    downloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = 'social-card.png';
      link.href = canvas.toDataURL();
      link.click();
      playSound('success');
    };

    // Scroll to preview
    container.scrollIntoView({ behavior: 'smooth' });
  };
}

// ========== Utility Functions ==========
function updateButtonStates() {
  const hasEnoughSelected = state.seriesSelection.size >= 2;
  const hasNews = state.news && state.news.length > 0;

  elements.analyzeNewsBtn.disabled = !hasNews;

  if (!hasEnoughSelected) {
    elements.seriesContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-database-2-line empty-icon"></i>
        <p>SELECT AT LEAST 2 ARTICLES TO GENERATE SERIES.</p>
        <button onclick="switchTab('fetch-news')" class="btn btn-primary" style="margin-top: 1rem;"><i class="ri-radar-line"></i> GO TO NEWS FEED</button>
      </div>
    `;
  } else {
    // Show the generate button when enough articles are selected
    elements.seriesContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-checkbox-circle-line" style="color: var(--neon-cyan); font-size: 3rem; margin-bottom: 1rem;"></i>
        <p style="color: var(--neon-cyan); font-weight: 600;">${state.seriesSelection.size} ARTICLES SELECTED FOR SERIES</p>
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
          <button onclick="switchTab('fetch-news')" class="btn btn-secondary"><i class="ri-arrow-left-line"></i> BACK TO NEWS</button>
          <button onclick="generateSeries()" class="btn btn-primary btn-glow"><i class="ri-film-line"></i> GENERATE SERIES</button>
        </div>
      </div>
    `;
  }

  if (!hasNews) {
    elements.analyticsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-line-chart-line empty-icon"></i>
        <p>NO DATA TO ANALYZE. SCAN FOR NEWS FIRST.</p>
        <button onclick="switchTab('fetch-news')" class="btn btn-primary" style="margin-top: 1rem;"><i class="ri-radar-line"></i> GO TO NEWS FEED</button>
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
  // If text is already a string, use it directly. Otherwise decode HTML entities
  let cleanText = text;
  if (typeof text === 'string' && text.includes('&')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    cleanText = tempDiv.textContent || tempDiv.innerText;
  }

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

  // Content Type Switching
  document.querySelectorAll('input[name="content-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      switchContentType(e.target.value);
    });
  });

  // Custom Dropdowns Initialization
  const dropdowns = [
    { id: 'platform-custom-select', inputId: 'platform-select', stateKey: 'platform' },
    { id: 'category-custom-select', inputId: 'category-select', stateKey: 'category' },
    { id: 'country-custom-select', inputId: 'country-select', stateKey: 'country' },
    { id: 'tone-custom-select', inputId: 'tone-select', stateKey: 'tone' },
    { id: 'book-custom-select', inputId: 'book-select', stateKey: 'bookSource' },
    { id: 'ai-source-custom-select', inputId: 'ai-source-select', stateKey: 'aiSource' }
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
  elements.analyzeNewsBtn.addEventListener('click', analyzeNews);

  // Tab Navigation
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Mobile Sidebar Toggle
  if (elements.mobileMenuBtn) {
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.sidebar.classList.add('active');
      elements.sidebarBackdrop.classList.add('active');
      playSound('click');
    });
  }

  if (elements.closeSidebarBtn) {
    elements.closeSidebarBtn.addEventListener('click', () => {
      elements.sidebar.classList.remove('active');
      elements.sidebarBackdrop.classList.remove('active');
      playSound('click');
    });
  }

  if (elements.sidebarBackdrop) {
    elements.sidebarBackdrop.addEventListener('click', () => {
      elements.sidebar.classList.remove('active');
      elements.sidebarBackdrop.classList.remove('active');
    });
  }
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
