# 🚀 Coolify Deployment Guide — SEO Bot

Step-by-step instructions to deploy the SEO Bot on Coolify.

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ A VPS with **Coolify already installed** (e.g., Hetzner, DigitalOcean)
- ✅ **Claude API key** (from https://console.anthropic.com)
- ✅ **WordPress site** with REST API enabled
- ✅ **WordPress Application Password** (Users → Profile → Application Passwords)
- ✅ Bot code in a **Git repository** (GitHub/GitLab) — recommended

---

## 🎯 Recommended Approach: Coolify Cron Job

This is the **cleanest** way to run the bot on Coolify. Coolify handles the schedule, the bot just runs once per day and exits.

### Step 1: Create New Resource

1. Open Coolify dashboard
2. Click **+ New Resource**
3. Select **Public Repository** (or Private if your repo is private)
4. Paste your repo URL: `https://github.com/yourname/seo-bot`
5. Branch: `main`

### Step 2: Configure Build

Coolify auto-detects the Dockerfile. Just verify:

- **Build Pack**: `Dockerfile`
- **Dockerfile Location**: `./Dockerfile`
- **Port**: Leave blank (no HTTP server needed)

### Step 3: Change Application Type to Cron Job

This is **the key step**:

1. In application settings, find **General** tab
2. Change **Application Type** from "Application" to **"Scheduled Task / Cron Job"**
3. Set **Schedule** (cron expression):
   - Daily at 6 AM: `0 6 * * *`
   - Daily at 9 AM: `0 9 * * *`
   - Twice daily (6 AM + 6 PM): `0 6,18 * * *`
4. **Command** (what runs on schedule): `node src/bot.js`

### Step 4: Add Environment Variables

In the **Environment Variables** tab, add these (mark as **secret** for sensitive ones):

| Variable | Value | Notes |
|----------|-------|-------|
| `CLAUDE_API_KEY` | `sk-ant-xxx...` | 🔒 Mark as secret |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | |
| `WP_URL` | `https://yoursite.com` | |
| `WP_USERNAME` | `admin` | |
| `WP_APP_PASSWORD` | `xxxx xxxx xxxx xxxx xxxx xxxx` | 🔒 Mark as secret |
| `ARTICLES_PER_DAY` | `1` | Start with 1 |
| `POST_STATUS` | `publish` | or `draft` for testing |
| `SITE_NICHE` | `group buy seo tools, ai tools` | Comma separated |
| `SITE_NAME` | `GroupBuyServices` | |
| `SITE_LANGUAGE` | `en` | or `bn`, `mixed` |
| `ARTICLE_WORD_COUNT` | `1800` | |
| `ARTICLE_TONE` | `expert` | |
| `DEFAULT_CATEGORY` | `0` | WP category ID |
| `DEFAULT_AUTHOR` | `1` | WP user ID |

### Step 5: Add Persistent Volume (CRITICAL!)

Without this, the bot will forget which keywords it already used after every restart!

1. Go to **Storage** tab
2. Click **+ Add Persistent Storage**
3. Configure:
   - **Name**: `seo-bot-data`
   - **Mount Path**: `/app/data`
   - **Host Path**: leave blank (auto-managed)

### Step 6: Deploy

1. Click **Deploy**
2. Watch the build logs — should complete in 1-2 minutes
3. Coolify will show **Deployed** status

### Step 7: Test Manually First!

Before waiting for the cron schedule, trigger it manually:

1. Go to your application in Coolify
2. Click **Run Now** (or **Execute** button on Cron Job)
3. Watch the logs in real-time
4. Check your WordPress site — first article should appear!

---

## 🔄 Alternative: Long-Running Service

If you prefer to run the bot as a continuous service (uses internal node-cron):

### Different Settings:

- **Application Type**: `Application` (not Cron Job)
- **Start Command**: `node src/index.js`
- **Add env var**: `DAILY_RUN_TIME=06:00`

This runs 24/7 and uses the bot's built-in scheduler. Slightly more RAM usage but the same end result.

**Recommendation**: Use **Cron Job mode** — it's lighter, more robust, and Coolify-native.

---

## 📊 Monitoring

### View Logs

In Coolify dashboard → your bot → **Logs** tab. You'll see:

```
[INFO] Starting SEO Bot daily run
━━━ STEP 1 ━━━
Refreshing internal link index
[✓] Indexed 24 posts and 18 products
━━━ STEP 2 ━━━
Researching keywords
[✓] Chosen keyword: "cheap semrush bangladesh" (commercial, low difficulty)
━━━ STEP 4 ━━━
[✓] Article written: "Cheap SEMRush in Bangladesh: How to Save 97%"
━━━ STEP 5 ━━━
[✓] Published! ID: 1247, URL: https://...
```

### Check Generated Articles

Two ways:

1. **WordPress Admin** → Posts (look for new posts)
2. **Coolify Terminal** → run: `cat /app/data/generated-articles.json`

### Check Used Keywords

`cat /app/data/used-keywords.json`

---

## ⚙️ Updating Settings

### Change articles per day:

1. Coolify → bot app → **Environment Variables**
2. Edit `ARTICLES_PER_DAY` (e.g., from `1` to `2`)
3. **Redeploy** (or wait for next cron trigger)

### Change schedule:

1. Coolify → bot app → **General**
2. Update **Schedule** field (cron expression)
3. Save

### Switch from auto-publish to draft:

1. Edit env var `POST_STATUS` → `draft`
2. Redeploy

---

## 🐛 Troubleshooting

### Build fails: "npm ci error"

Make sure `package.json` and `package-lock.json` are both committed to Git. If `package-lock.json` doesn't exist, run `npm install` locally first to generate it.

### Bot runs but no article appears

Check logs for these issues:
- "Claude API error" → API key wrong or no credits
- "WordPress 401" → Application Password wrong
- "Failed to create post" → User doesn't have post permissions

### "All keywords used"

After many runs, the bot may exhaust common keywords. Add more topics to `SITE_NICHE`:
```
SITE_NICHE=seo tools, ai tools, content writing, design tools, video editing
```

### Cron didn't trigger

Verify cron expression with https://crontab.guru/

### Articles look "too AI"

Phase 2 will add Quillbot + Hix Bypass for humanization. For now, you can:
- Adjust `ARTICLE_TONE` (try `casual` or `friendly`)
- Set `POST_STATUS=draft` and edit before publishing

---

## 💰 Cost on Coolify

Since you self-host Coolify on a VPS:

| Item | Cost |
|------|------|
| VPS (Hetzner CX11) | $4/month |
| Coolify | Free |
| Claude API (~30 articles) | $5-15/month |
| **Total** | **~$10-20/month** |

The same VPS can host **10+ other Coolify apps** at no extra cost.

---

## 🚀 Going to Production

Once you're happy with quality on the test WordPress site:

1. **Migrate to your Laravel main site:**
   - Build a small Laravel API endpoint (`POST /api/articles`) that mirrors the WP REST format
   - Update one env var: `WP_URL=https://your-laravel-site.com`
   - That's it! The bot doesn't care what's behind the API.

2. **Scale up:**
   - Increase `ARTICLES_PER_DAY` to 2-3
   - Add more niches to `SITE_NICHE`
   - Monitor Google Search Console for indexing

3. **Add Phase 2:**
   - Product description optimizer
   - Quillbot/Hix Bypass for humanization
   - Featured image generation

---

## 📝 Update / Redeploy

To update the bot code:

1. Push changes to Git
2. Coolify → bot app → **Deploy** button
3. Coolify pulls latest code, rebuilds, redeploys

That's it. Your data (used keywords, etc.) is preserved in the volume.
