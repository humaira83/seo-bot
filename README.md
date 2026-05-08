# 🤖 SEO Bot — Autonomous Content Engine

Daily auto-generates SEO-optimized, human-like articles on your WordPress site. Researches keywords, writes articles, adds internal links, and publishes — fully automated.

---

## 📋 What This Bot Does

✅ **Keyword Research** — Discovers fresh long-tail keywords via Google Suggest (free)  
✅ **Smart Selection** — Claude picks the best keyword based on intent + difficulty  
✅ **Article Writing** — 1500-2500 word SEO articles in human-like voice  
✅ **Internal Linking** — Auto-adds 5-7 contextual links to existing pages  
✅ **Sales Driving** — Mentions products organically in articles  
✅ **Auto Publishing** — Publishes to WordPress with full SEO meta  
✅ **Duplicate Prevention** — Tracks used keywords, never repeats  
✅ **Logging** — Full audit trail in `data/logs/`

---

## 🚀 Quick Start (10 minutes)

### Step 1: Install Node.js on your VPS

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # should show v20.x
npm --version
```

### Step 2: Upload bot code to server

```bash
cd /opt
# Upload the seo-bot folder via SCP/FTP, or:
git clone <your-repo> seo-bot
cd seo-bot
npm install
```

### Step 3: Get WordPress Application Password

1. Log into WordPress admin
2. Go to **Users → Profile**
3. Scroll to **Application Passwords**
4. Enter name "SEO Bot", click **Add New**
5. Copy the password (looks like: `xxxx xxxx xxxx xxxx xxxx xxxx`)

### Step 4: Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add credit ($5 minimum)

### Step 5: Configure the bot

```bash
cp .env.example .env
nano .env  # or use any text editor
```

Fill in:
- `CLAUDE_API_KEY` — your Anthropic key
- `WP_URL` — your WordPress site URL
- `WP_USERNAME` — your WP admin username
- `WP_APP_PASSWORD` — the application password from Step 3
- `SITE_NICHE` — describe your site's topics
- `ARTICLES_PER_DAY` — 1 to start, scale up later

### Step 6: Test the connection

```bash
# Test Claude API
npm run test-api

# Test WordPress connection
npm run test-wp
```

If both show ✓ success, you're ready!

### Step 7: Generate your first article (manual test)

```bash
npm run generate
```

This will:
1. Research keywords
2. Pick the best one
3. Write a full article
4. Publish to WordPress (or save as draft based on POST_STATUS)

Check your WordPress site — your first AI-generated article should be there!

### Step 8: Run as background service (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the bot
pm2 start src/index.js --name seo-bot

# Make it auto-start on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs seo-bot

# Stop
pm2 stop seo-bot
```

---

## ⚙️ Configuration Options (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `ARTICLES_PER_DAY` | How many articles to generate daily | `1` |
| `DAILY_RUN_TIME` | When to run (24h format) | `06:00` |
| `POST_STATUS` | `publish` or `draft` | `publish` |
| `SITE_NICHE` | Comma-separated topics | `seo tools, ai tools` |
| `SITE_LANGUAGE` | `en`, `bn`, or `mixed` | `en` |
| `ARTICLE_WORD_COUNT` | Target word count | `1800` |
| `ARTICLE_TONE` | Writing tone | `expert` |

---

## 🧠 How It Works

```
   ┌─────────────────────────────────────┐
   │  1. CRON TRIGGER (e.g., 6 AM daily) │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  2. REFRESH INDEX                   │
   │     - Fetch all WP posts            │
   │     - Fetch all products            │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  3. KEYWORD RESEARCH                │
   │     - Google Suggest API (free)     │
   │     - Generate 50+ candidates       │
   │     - Skip already-used keywords    │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  4. CLAUDE PICKS BEST KEYWORD       │
   │     - Analyzes intent               │
   │     - Estimates difficulty          │
   │     - Suggests article angle        │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  5. PICK INTERNAL LINKS             │
   │     - Score posts/products by       │
   │       keyword relevance             │
   │     - Pick top 7-8                  │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  6. CLAUDE WRITES ARTICLE           │
   │     - Human-like prose              │
   │     - SEO optimized                 │
   │     - Embeds internal links         │
   │     - Mentions products naturally   │
   │     - Adds FAQ section              │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  7. PUBLISH TO WORDPRESS            │
   │     - Sets title, content, slug     │
   │     - Adds Yoast/RankMath SEO meta  │
   │     - Auto-publish or draft         │
   └────────────┬────────────────────────┘
                ↓
   ┌─────────────────────────────────────┐
   │  8. LOG & TRACK                     │
   │     - Mark keyword as used          │
   │     - Log article to history        │
   └─────────────────────────────────────┘
```

---

## 💰 Costs

| Item | Monthly Cost |
|------|--------------|
| VPS (cheapest, e.g., Hetzner CX11) | $4-5 |
| Claude API (~30 articles) | $5-15 |
| **Total** | **~$10-20/month** |

vs. hiring a content writer: $300-500/month

---

## 🐛 Troubleshooting

**"Claude API error"**  
→ Check `CLAUDE_API_KEY` is correct and account has credits

**"WordPress 401 Unauthorized"**  
→ Application Password is wrong. Recreate it in WP profile.

**"All keywords used"**  
→ Bot has been running long enough that all suggestions are exhausted. Add more seed niches in `SITE_NICHE`.

**Articles look "AI-like"**  
→ This is Phase 1. Phase 2 will add Quillbot + Hix Bypass for humanization.

---

## 📅 Roadmap

**✅ Phase 1 (Current):** Article generation + auto-publish + internal linking

**🔜 Phase 2:** 
- Product description optimizer
- Quillbot integration (humanization)
- Hix Bypass integration (AI detection bypass)

**🔜 Phase 3:**
- Featured image generation (Flux / DALL-E)
- Multi-language support (English + Bengali parallel)
- Performance dashboard

**🔜 Phase 4:**
- Migration from WordPress test → Laravel main site
- Just change `WP_URL` to Laravel API endpoint

---

## 📝 License

Private use for GroupBuyServices.
