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

    const { title = '', description = '', url = '' } = article;

    const platformConfigs = {
      twitter: { char_limit: 280, style: 'concise and engaging' },
      linkedin: { char_limit: 700, style: 'professional and insightful' },
      instagram: { char_limit: 500, style: 'visual and catchy' },
      facebook: { char_limit: 400, style: 'conversational' },
      tiktok: { char_limit: 300, style: 'trendy and casual' },
    };

    const config = platformConfigs[platform] || platformConfigs.twitter;

    const systemPrompt = `You are a social media strategist. Create an engaging ${platform} post.

Requirements:
- Character limit: ${config.char_limit}
- Tone: ${tone}
- Style: ${config.style}
- Include hashtags: ${include_hashtags}
- Include link: ${include_link}
- Custom angle: ${custom_angle || 'Standard news sharing'}
Return plain text only (no JSON).`;

    const userPrompt = `Title: ${title}\nDescription: ${description}\nURL: ${include_link ? url : ''}`;

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
