# ================================
# GPT News API (flask_api.py)
# ================================
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
from datetime import datetime

# OpenAI client import compatible with openai>=1.x
try:
    from openai import OpenAI
except ImportError:
    import openai  # type: ignore
    OpenAI = getattr(openai, "OpenAI")

load_dotenv()
import feedparser

app = Flask(__name__)
CORS(app)

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = None
if OPENAI_KEY:
    client = OpenAI(api_key=OPENAI_KEY)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "GPT News API running"})


@app.route("/generate_news", methods=["GET"])
def generate_news():
    """
    Fetch real news from Google News RSS feeds.
    Returns articles with REAL, working URLs.
    """
    try:
        country = request.args.get("country", "us")
        category = request.args.get("category", "general")
        limit = int(request.args.get("limit", 5))

        # Map categories to search terms
        category_search = {
            "general": "latest news",
            "business": "business",
            "technology": "technology",
            "entertainment": "entertainment",
            "sports": "sports",
            "science": "science",
            "health": "health"
        }

        search_term = category_search.get(category.lower(), "latest news")
        
        # Use Google News search RSS (more reliable than topic RSS)
        rss_url = f"https://news.google.com/rss/search?q={search_term}+when:2d&hl=en-{country.upper()}&gl={country.upper()}&ceid={country.upper()}:en"
        
        print(f"Fetching RSS from: {rss_url}")

        # Parse RSS feed with User-Agent header
        feed = feedparser.parse(rss_url, agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        if not feed.entries:
            return jsonify({"success": False, "error": "No articles found in RSS feed"}), 404

        # Convert to required format
        articles = []
        for entry in feed.entries[:limit]:
            # Parse date
            pub_date = entry.get("published_parsed")
            if pub_date:
                date_str = f"{pub_date.tm_mday:02d}/{pub_date.tm_mon:02d}/{pub_date.tm_year}"
            else:
                date_str = datetime.utcnow().strftime("%d/%m/%Y")
            
            articles.append({
                "title": entry.title,
                "url": entry.link,  # REAL URL from RSS
                "Date Published": date_str
            })

        return jsonify({
            "success": True,
            "articles": articles,
            "count": len(articles)
        })

    except Exception as e:
        print(f"Error fetching RSS: {e}")
        return jsonify({"success": False, "error": f"Failed to fetch news: {str(e)}"}), 500



@app.route("/create_social_content", methods=["POST"])
def create_social_content():
    """Generate platform-specific social post for a single article."""
    try:
        if client is None:
            return jsonify({"success": False, "error": "OpenAI API key missing"}), 400

        data = request.json or {}
        article = data.get("article", {}) or {}
        platform = data.get("platform", "twitter")
        tone = data.get("tone", "informative")
        include_hashtags = data.get("include_hashtags", True)
        include_link = data.get("include_link", True)
        custom_angle = data.get("custom_angle", "")

        title = article.get("title", "")
        description = article.get("description", "")
        url = article.get("url", "")

        platform_configs = {
            "twitter": {"char_limit": 280, "style": "concise and engaging"},
            "linkedin": {"char_limit": 700, "style": "professional and insightful"},
            "instagram": {"char_limit": 500, "style": "visual and catchy"},
            "facebook": {"char_limit": 400, "style": "conversational"},
            "tiktok": {"char_limit": 300, "style": "trendy and casual"},
        }
        config = platform_configs.get(platform, platform_configs["twitter"])

        system_prompt = f"""You are a social media strategist. Create an engaging {platform} post.

Requirements:
- Character limit: {config['char_limit']}
- Tone: {tone}
- Style: {config['style']}
- Include hashtags: {include_hashtags}
- Include link: {include_link}
- Custom angle: {custom_angle or "Standard news sharing"}
Return plain text only (no JSON).
"""

        user_prompt = f"Title: {title}\nDescription: {description}\nURL: {url if include_link else ''}"

        resp = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=400,
        )

        content = resp.choices[0].message.content.strip()

        return jsonify({"success": True, "content": content, "platform": platform})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/create_content_series", methods=["POST"])
def create_content_series():
    """Generate a thread/series across multiple articles."""
    try:
        if client is None:
            return jsonify({"success": False, "error": "OpenAI API key missing"}), 400

        data = request.json or {}
        articles = data.get("articles", []) or []
        platform = data.get("platform", "twitter")
        theme = data.get("theme", "daily roundup")
        tone = data.get("tone", "informative")

        if len(articles) < 2:
            return jsonify({"success": False, "error": "Need at least 2 articles"}), 400

        bullets = "\n".join(
            [f"- {a.get('title')} — {a.get('description')}" for a in articles[:5]]
        )

        system_prompt = f"""You are a strategist. Create a {platform} series with theme '{theme}'.
- Tone: {tone}
- Provide an intro + one post per article
- If the platform supports threads, number them like (1/n), (2/n)...
Return plain text only.
"""

        resp = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": bullets},
            ],
            temperature=0.7,
            max_tokens=900,
        )

        content = resp.choices[0].message.content.strip()

        return jsonify(
            {"success": True, "series": content, "platform": platform, "theme": theme}
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/analyze_news", methods=["POST"])
def analyze_news():
    """Analyze the set of articles for sentiment, themes, and strategy."""
    try:
        if client is None:
            return jsonify({"success": False, "error": "OpenAI API key missing"}), 400

        data = request.json or {}
        articles = data.get("articles", []) or []

        text = "\n".join(
            [f"{a.get('title')}: {a.get('description')}" for a in articles[:10]]
        )

        system_prompt = """You are a strategist. Analyze these articles and provide:
1) Sentiment breakdown (positive/negative/neutral %) and brief justification
2) Key themes and takeaways
3) Content strategy recommendations
4) Best posting times by platform (based on general best practices)
5) Potential viral angles or hooks
Return structured text (no JSON).
"""

        resp = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.6,
            max_tokens=900,
        )

        content = resp.choices[0].message.content.strip()

        return jsonify({"success": True, "analysis": content})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("NEWS_API_PORT", "5001"))
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)