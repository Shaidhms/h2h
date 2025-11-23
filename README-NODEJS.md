# 📰 From Headlines to Hashtags

**A Social Media Content Generator — Powered by OpenAI ChatGPT 🤖**

✨ Dreamed, Designed & Delivered by **Shaid** | Guided by **Social Eagle** 🦅

Transform today's breaking news into engaging social media content with AI-powered precision. A modern Node.js + Vite web application.

## 🌟 Features

- **📰 Intelligent News Generation** - GPT-powered fresh headlines (no external APIs needed)
- **📝 Platform-Specific Content** - Optimized posts for Twitter, LinkedIn, Instagram, Facebook, TikTok
- **📊 Content Series Builder** - Multi-post threads with narrative flow
- **📈 Analytics & Strategy** - Sentiment analysis and content recommendations
- **🎨 Premium UI/UX** - Dark/light mode with glassmorphism and smooth animations
- **📱 Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API Key

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

3. **Start the application**
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5001`
- Frontend on `http://localhost:5173`

4. **Open your browser**
Navigate to `http://localhost:5173` and start creating content!

## 📦 Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 How to Use

### 1. Configure Your Settings
Use the sidebar to select:
- **Category** - Technology, Business, Health, Science, etc.
- **Country** - US, India, UK, Canada, etc.
- **Platform** - Twitter, LinkedIn, Instagram, etc.
- **Tone** - Informative, Engaging, Professional, etc.

### 2. Fetch News
Click "Fetch Latest News" to generate fresh headlines from the last 2 days using GPT.

### 3. Create Content
Select an article and click "Create Content" to generate platform-optimized social media posts.

### 4. Build Series
Generate multi-post threads from multiple articles for enhanced engagement.

### 5. Analyze
Get sentiment analysis, key themes, and content strategy recommendations.

## 🔧 Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional - Model Configuration
OPENAI_NEWS_MODEL=gpt-4o-mini      # For news generation
OPENAI_CONTENT_MODEL=gpt-4o        # For content creation

# Server Port
PORT=5001
```

### Recommended Models
- **News Generation**: `gpt-4o-mini` (fast, cost-effective)
- **Content Creation**: `gpt-4o` or `gpt-4-turbo` (higher quality)

## 🏗️ Architecture

```
headlines2hashtag/
├── server.js              # Express backend API
├── index.html             # Main HTML structure
├── src/
│   ├── main.js           # Frontend application logic
│   └── style.css         # Premium design system
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables (create from .env.example)
```

## 🎨 Design Features

- **Modern Color Palette** - Vibrant gradients and accent colors
- **Glassmorphism** - Frosted glass effect on cards
- **Smooth Animations** - Micro-interactions and transitions
- **Dark/Light Mode** - Seamless theme switching
- **Responsive Layout** - Mobile-first design approach

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/generate-news` | GET | Fetch fresh news headlines |
| `/api/create-social-content` | POST | Generate platform-specific posts |
| `/api/create-content-series` | POST | Create multi-post threads |
| `/api/analyze-news` | POST | Sentiment analysis & strategy |

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Credits

- **Creator**: Shaid - Vision, Design, and Development
- **Mentor**: Social Eagle 🦅 - Strategic Guidance
- **AI Platform**: OpenAI ChatGPT - Intelligence engine

---

**Made with ❤️ by Shaid | Guided by Social Eagle 🦅**

*"Turn today's news into tomorrow's engagement"*
