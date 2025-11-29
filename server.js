// ==========================================
// Headlines to Hashtags - Backend Server
// ==========================================
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

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

// Generate news headlines (NOW FETCHING REAL RSS)
app.get('/api/generate-news', async (req, res) => {
  try {
    const { country = 'us', category = 'general', limit = 5 } = req.query;

    // Map categories to search terms (same as Flask)
    const categorySearch = {
      'general': 'latest news',
      'business': 'business',
      'technology': 'technology',
      'entertainment': 'entertainment',
      'sports': 'sports',
      'science': 'science',
      'health': 'health'
    };

    const searchTerm = categorySearch[category] || 'latest news';

    // Use Google News search RSS (more reliable than topic RSS)
    const rssUrl = `https://news.google.com/rss/search?q=${searchTerm}+when:2d&hl=en-${country.toUpperCase()}&gl=${country.toUpperCase()}&ceid=${country.toUpperCase()}:en`;

    console.log(`Fetching RSS from: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    const feed = await parser.parseString(text);

    if (!feed.items || feed.items.length === 0) {
      return res.status(404).json({ success: false, error: 'No articles found in RSS feed' });
    }

    const articles = feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.content || 'Click to read full story.',
      source: item.source || 'Google News',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      url: item.link // REAL URL from RSS
    }));

    return res.json({ success: true, articles, count: articles.length });

  } catch (error) {
    console.error('Error fetching news RSS:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch real news: ' + error.message });
  }
});

// Generate motivational quotes from books (Still AI, but valid search URL)
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

    const systemPrompt = `You are a wisdom curator.
Return ONLY valid JSON.
JSON must be an array of objects with keys:
- title (catchy title)
- description (the quote/lesson)
- source (book name)
- published_at (today's date YYYY-MM-DD)
- url (generate a Goodreads Search URL: https://www.goodreads.com/search?q=BOOK_TITLE)
Constraints:
- Extract wisdom from "${bookTitle}"
- Return exactly ${limit} items`;

    const userPrompt = `Book: ${bookTitle}\nNumber of quotes: ${limit}`;

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
      // Strip markdown code blocks if present (GPT sometimes wraps JSON in ```json ... ```)
      let cleanContent = content;
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const articles = JSON.parse(cleanContent);
      return res.json({ success: true, articles: articles.slice(0, limit), count: articles.length });
    } catch (e) {
      return res.status(502).json({ success: false, error: `Invalid JSON from GPT: ${e.message}`, raw: content });
    }
  } catch (error) {
    console.error('Error generating quotes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Generate AI-related content (NOW FETCHING REAL RSS)
app.get('/api/generate-ai-content', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Trending AI topics that rotate for variety
    const trendingAITopics = [
      'ChatGPT OR OpenAI OR GPT-4',
      'Claude OR Anthropic',
      'Google Gemini OR Google AI',
      'LLM OR Large Language Model',
      'Computer Vision OR Image Recognition',
      'AI Robotics',
      'Machine Learning breakthrough',
      'DeepMind',
      'AI Ethics OR AI Safety',
      'Generative AI',
      'AI Regulation OR AI Policy',
      'AI in Healthcare',
      'Autonomous Vehicles OR Self-Driving',
      'AI Agents',
      'Semiconductor AI chips'
    ];

    // Rotate through topics based on current minute (changes every minute)
    const topicIndex = Math.floor(Date.now() / 60000) % trendingAITopics.length;
    const selectedTopic = trendingAITopics[topicIndex];

    // Google News RSS for trending AI topic with recent filter
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(selectedTopic)}+when:2d&hl=en-US&gl=US&ceid=US:en`;

    console.log(`Fetching AI RSS from: ${rssUrl} (Topic: ${selectedTopic})`);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const text = await response.text();
    const feed = await parser.parseString(text);

    if (!feed.items || feed.items.length === 0) {
      // Fallback to generic AI news if specific topic has no results
      const fallbackUrl = 'https://news.google.com/rss/search?q=Artificial+Intelligence+when:2d&hl=en-US&gl=US&ceid=US:en';
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const fallbackText = await fallbackResponse.text();
      const fallbackFeed = await parser.parseString(fallbackText);

      const articles = fallbackFeed.items.slice(0, limit).map(item => ({
        title: item.title,
        description: item.contentSnippet || 'Latest AI News',
        source: 'AI News',
        published_at: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        url: item.link
      }));

      return res.json({ success: true, articles, count: articles.length });
    }

    const articles = feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || 'Latest AI News',
      source: item.source || 'Google News AI',
      published_at: new Date(item.pubDate).toISOString().split('T')[0],
      url: item.link // REAL URL
    }));

    return res.json({ success: true, articles, count: articles.length });
  } catch (error) {
    console.error('Error fetching AI RSS:', error);
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
- Include link: ${include_link ? 'YES - YOU MUST include the article URL at the end of your post' : 'NO'}
- Custom angle: ${custom_angle || 'Standard sharing'}
- Context: ${contentContext}

${include_link ? 'IMPORTANT: Always end your post with the article URL on a new line.' : ''}
Return plain text only (no JSON).`;

    const userPrompt = `Title: ${title}\nDescription: ${description}\nSource: ${source}${include_link ? `\nArticle URL (include this at the end): ${url}` : ''}`;

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
