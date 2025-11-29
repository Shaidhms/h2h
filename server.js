// ==========================================
// Headlines to Hashtags - Backend Server
// ==========================================
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ========== API Endpoints ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Headlines to Hashtags API running' });
});

// Generate news headlines
app.get('/api/generate-news', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { country = 'us', category = 'general', limit = 5 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a global news summarizer.
Return ONLY valid JSON (no markdown, no commentary).
JSON must be an array of objects with keys:
- title
- description
- source
- published_at  (must be ${today} or within the last 2 days; use ISO-like YYYY-MM-DD)
- url
Constraints:
- Focus on the requested country and category.
- Return exactly the requested number of items.
- Be realistic and timely, but you may invent plausible headlines if needed.
- Do NOT include anything older than 2 days.`;

    const userPrompt = `Country: ${country}\nCategory: ${category}\nNumber of items: ${limit}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_NEWS_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();

    try {
      const articles = JSON.parse(content);
      if (!Array.isArray(articles)) {
        throw new Error('Expected list of articles');
      }
      return res.json({ success: true, articles: articles.slice(0, limit), count: articles.length });
    } catch (e) {
      return res.status(502).json({ success: false, error: `Invalid JSON from GPT: ${e.message}`, raw: content });
    }
  } catch (error) {
    console.error('Error generating news:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Generate motivational quotes from books
app.get('/api/generate-quotes', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { book = 'think-grow-rich', limit = 5 } = req.query;

    const bookNames = {
      'think-grow-rich': 'Think and Grow Rich by Napoleon Hill',
      'atomic-habits': 'Atomic Habits by James Clear',
      '7-habits': 'The 7 Habits of Highly Effective People by Stephen Covey',
      'power-of-now': 'The Power of Now by Eckhart Tolle',
      'mans-search': "Man's Search for Meaning by Viktor Frankl",
      'alchemist': 'The Alchemist by Paulo Coelho'
    };

    const bookTitle = bookNames[book] || 'Think and Grow Rich by Napoleon Hill';

    const systemPrompt = `You are a wisdom curator and motivational speaker.
Return ONLY valid JSON (no markdown, no commentary).
JSON must be an array of objects with keys:
- title (a short, catchy title for the quote/lesson)
- description (2-3 sentences explaining the context and application)
- source (the book name)
- published_at (today's date in YYYY-MM-DD format)
- url (use "#" as placeholder)
Constraints:
- Extract powerful, actionable wisdom from "${bookTitle}"
- Each entry should feel like a mini-lesson or insight
- Make titles inspiring and tweet-worthy
- Return exactly ${limit} items`;

    const userPrompt = `Book: ${bookTitle}\nNumber of quotes/lessons: ${limit}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_NEWS_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();

    try {
      const articles = JSON.parse(content);
      if (!Array.isArray(articles)) {
        throw new Error('Expected list of quotes');
      }
      return res.json({ success: true, articles: articles.slice(0, limit), count: articles.length });
    } catch (e) {
      return res.status(502).json({ success: false, error: `Invalid JSON from GPT: ${e.message}`, raw: content });
    }
  } catch (error) {
    console.error('Error generating quotes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Generate AI-related content from sources
app.get('/api/generate-ai-content', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { source = 'openai', limit = 5 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const sourceNames = {
      'openai': 'OpenAI Blog',
      'google-ai': 'Google AI Blog',
      'huggingface': 'Hugging Face Blog',
      'anthropic': 'Anthropic News',
      'deepmind': 'DeepMind Blog',
      'mit-tech': 'MIT Technology Review (AI Section)'
    };

    const sourceName = sourceNames[source] || 'OpenAI Blog';

    const systemPrompt = `You are an AI industry analyst and tech journalist.
Return ONLY valid JSON (no markdown, no commentary).
JSON must be an array of objects with keys:
- title (headline about AI development, research, or news)
- description (2-3 sentences explaining the AI advancement or news)
- source (${sourceName})
- published_at (must be ${today} or within the last 2 days; use ISO-like YYYY-MM-DD)
- url (use "#" as placeholder)
Constraints:
- Focus on cutting-edge AI developments, research breakthroughs, product launches, or industry trends
- Make content feel current and relevant to ${sourceName}
- Include topics like: LLMs, computer vision, robotics, ML research, AI ethics, AI products
- Return exactly ${limit} items
- Be realistic and timely`;

    const userPrompt = `Source: ${sourceName}\nNumber of articles: ${limit}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_NEWS_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();

    try {
      const articles = JSON.parse(content);
      if (!Array.isArray(articles)) {
        throw new Error('Expected list of AI articles');
      }
      return res.json({ success: true, articles: articles.slice(0, limit), count: articles.length });
    } catch (e) {
      return res.status(502).json({ success: false, error: `Invalid JSON from GPT: ${e.message}`, raw: content });
    }
  } catch (error) {
    console.error('Error generating AI content:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create social media content
app.post('/api/create-social-content', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const {
      article = {},
      platform = 'twitter',
      tone = 'informative',
      include_hashtags = true,
      include_link = true,
      custom_angle = '',
    } = req.body;

    const { title = '', description = '', source = '', url = '' } = article;

    // Detect content type based on source
    let contentType = 'news';
    if (source.includes('Napoleon Hill') || source.includes('James Clear') || source.includes('Stephen Covey') ||
      source.includes('Eckhart Tolle') || source.includes('Viktor Frankl') || source.includes('Paulo Coelho')) {
      contentType = 'quote';
    } else if (source.includes('OpenAI') || source.includes('Google AI') || source.includes('Hugging Face') ||
      source.includes('Anthropic') || source.includes('DeepMind') || source.includes('MIT Tech')) {
      contentType = 'ai';
    }

    const platformConfigs = {
      twitter: { char_limit: 280, style: 'concise and engaging' },
      linkedin: { char_limit: 700, style: 'professional and insightful' },
      instagram: { char_limit: 500, style: 'visual and catchy' },
      facebook: { char_limit: 400, style: 'conversational' },
    };

    const config = platformConfigs[platform] || platformConfigs.twitter;

    // Adjust prompt based on content type
    let contentContext = '';
    if (contentType === 'quote') {
      contentContext = 'This is a motivational quote/lesson from a famous book. Make it inspirational and actionable.';
    } else if (contentType === 'ai') {
      contentContext = 'This is AI industry news/development. Make it informative and highlight the significance.';
    } else {
      contentContext = 'This is current news. Make it timely and relevant.';
    }

    const systemPrompt = `You are a social media strategist. Create an engaging ${platform} post.

Requirements:
- Character limit: ${config.char_limit}
- Tone: ${tone}
- Style: ${config.style}
- Include hashtags: ${include_hashtags}
- Include link: ${include_link}
- Custom angle: ${custom_angle || 'Standard sharing'}
- Context: ${contentContext}
Return plain text only (no JSON).`;

    const userPrompt = `Title: ${title}\nDescription: ${description}\nSource: ${source}\nURL: ${include_link ? url : ''}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CONTENT_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = response.choices[0].message.content.trim();
    return res.json({ success: true, content, platform });
  } catch (error) {
    console.error('Error creating social content:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Generate image with DALL-E 3
app.post('/api/generate-image', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { article = {} } = req.body;
    const { title = '', description = '', source = '' } = article;

    // Detect content type for optimized prompts
    let contentType = 'news';
    let styleGuide = 'photorealistic news photography style';

    if (source.includes('Napoleon Hill') || source.includes('James Clear') || source.includes('Stephen Covey') ||
      source.includes('Eckhart Tolle') || source.includes('Viktor Frankl') || source.includes('Paulo Coelho')) {
      contentType = 'quote';
      styleGuide = 'inspirational, minimalist design with warm colors and motivational atmosphere';
    } else if (source.includes('OpenAI') || source.includes('Google AI') || source.includes('Hugging Face') ||
      source.includes('Anthropic') || source.includes('DeepMind') || source.includes('MIT Tech')) {
      contentType = 'ai';
      styleGuide = 'futuristic tech visualization with modern, sleek design and digital elements';
    }

    // Create optimized DALL-E prompt
    const imagePrompt = `Create a visually stunning image for social media about: "${title}". 
${description ? `Context: ${description.substring(0, 200)}` : ''}
Style: ${styleGuide}. 
The image should be engaging, professional, and perfect for ${contentType === 'quote' ? 'inspirational' : contentType === 'ai' ? 'tech-focused' : 'news'} social media posts.
Avoid text in the image.`;

    console.log('Generating image with prompt:', imagePrompt.substring(0, 150) + '...');

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;

    return res.json({
      success: true,
      imageUrl,
      contentType,
      prompt: imagePrompt.substring(0, 200) + '...' // For debugging
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy image to bypass CORS
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL missing' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const bufferObj = Buffer.from(buffer);

    res.set('Content-Type', 'image/png');
    res.send(bufferObj);
  } catch (error) {
    console.error('Error proxying image:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create content series
app.post('/api/create-content-series', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { articles = [], platform = 'twitter', theme = 'daily roundup', tone = 'informative' } = req.body;

    if (articles.length < 2) {
      return res.status(400).json({ success: false, error: 'Need at least 2 articles' });
    }

    const bullets = articles
      .slice(0, 5)
      .map((a) => `- ${a.title} — ${a.description}`)
      .join('\n');

    const systemPrompt = `You are a strategist. Create a ${platform} series with theme '${theme}'.
- Tone: ${tone}
- Provide an intro + one post per article
- If the platform supports threads, number them like (1/n), (2/n)...
Return plain text only.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CONTENT_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: bullets },
      ],
      temperature: 0.7,
      max_tokens: 900,
    });

    const content = response.choices[0].message.content.trim();
    return res.json({ success: true, series: content, platform, theme });
  } catch (error) {
    console.error('Error creating content series:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze news
app.post('/api/analyze-news', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ success: false, error: 'OpenAI API key missing' });
    }

    const { articles = [] } = req.body;

    const text = articles
      .slice(0, 10)
      .map((a) => `${a.title}: ${a.description}`)
      .join('\n');

    const systemPrompt = `You are a strategist. Analyze these articles and provide:
1) Sentiment breakdown (positive/negative/neutral %) and brief justification
2) Key themes and takeaways
3) Content strategy recommendations
4) Best posting times by platform (based on general best practices)
5) Potential viral angles or hooks
Return structured text (no JSON).`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CONTENT_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.6,
      max_tokens: 900,
    });

    const content = response.choices[0].message.content.trim();
    return res.json({ success: true, analysis: content });
  } catch (error) {
    console.error('Error analyzing news:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Headlines to Hashtags API running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
