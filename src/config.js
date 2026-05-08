/**
 * Configuration loader
 * Supports both Claude and OpenAI providers
 */
require('dotenv').config();

const config = {
  // Which AI provider to use: 'claude' or 'openai'
  aiProvider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  wordpress: {
    url: process.env.WP_URL?.replace(/\/$/, ''),
    username: process.env.WP_USERNAME,
    appPassword: process.env.WP_APP_PASSWORD?.replace(/\s/g, ''),
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

function validate() {
  const errors = [];
  
  if (config.aiProvider === 'claude' && !config.claude.apiKey) {
    errors.push('AI_PROVIDER=claude but CLAUDE_API_KEY is missing');
  }
  if (config.aiProvider === 'openai' && !config.openai.apiKey) {
    errors.push('AI_PROVIDER=openai but OPENAI_API_KEY is missing');
  }
  if (!['claude', 'openai'].includes(config.aiProvider)) {
    errors.push(`Invalid AI_PROVIDER: "${config.aiProvider}" (use "claude" or "openai")`);
  }
  
  if (!config.wordpress.url) errors.push('WP_URL is required');
  if (!config.wordpress.username) errors.push('WP_USERNAME is required');
  if (!config.wordpress.appPassword) errors.push('WP_APP_PASSWORD is required');
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\n💡 Check your .env file or Coolify environment variables\n');
    process.exit(1);
  }
}

module.exports = { config, validate };
