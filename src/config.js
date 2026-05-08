/**
 * Configuration loader
 * Loads .env and validates required variables
 */
require('dotenv').config();

const config = {
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  },
  wordpress: {
    url: process.env.WP_URL?.replace(/\/$/, ''), // remove trailing slash
    username: process.env.WP_USERNAME,
    appPassword: process.env.WP_APP_PASSWORD?.replace(/\s/g, ''), // remove spaces
  },
  bot: {
    articlesPerDay: parseInt(process.env.ARTICLES_PER_DAY) || 1,
    dailyRunTime: process.env.DAILY_RUN_TIME || '06:00',
    postStatus: process.env.POST_STATUS || 'draft',
    defaultCategory: parseInt(process.env.DEFAULT_CATEGORY) || 0,
    defaultAuthor: parseInt(process.env.DEFAULT_AUTHOR) || 1,
  },
  content: {
    niche: process.env.SITE_NICHE || 'general',
    siteName: process.env.SITE_NAME || 'My Site',
    language: process.env.SITE_LANGUAGE || 'en',
    wordCount: parseInt(process.env.ARTICLE_WORD_COUNT) || 1800,
    tone: process.env.ARTICLE_TONE || 'expert',
  },
};

// Validation
function validate() {
  const errors = [];
  if (!config.claude.apiKey) errors.push('CLAUDE_API_KEY is required');
  if (!config.wordpress.url) errors.push('WP_URL is required');
  if (!config.wordpress.username) errors.push('WP_USERNAME is required');
  if (!config.wordpress.appPassword) errors.push('WP_APP_PASSWORD is required');
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\n💡 Copy .env.example to .env and fill in the values\n');
    process.exit(1);
  }
}

module.exports = { config, validate };
