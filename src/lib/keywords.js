/**
 * Keyword Research Module
 * Uses Google Suggest (free) to discover long-tail keywords
 */
const axios = require('axios');
const { config } = require('../config');
const { askJSON } = require('./ai');
const { keywordStore } = require('./storage');
const logger = require('./logger');

/**
 * Get keyword suggestions from Google Suggest API (free, no key needed)
 */
async function getGoogleSuggestions(seed) {
  try {
    const res = await axios.get('http://suggestqueries.google.com/complete/search', {
      params: { client: 'firefox', q: seed },
      timeout: 5000,
    });
    return res.data[1] || [];
  } catch (err) {
    return [];
  }
}

/**
 * Generate seed keyword variations using A-Z + question modifiers
 */
function generateSeedVariations(niche) {
  const modifiers = [
    '', // base
    'best', 'cheap', 'how to', 'what is', 'why', 'when',
    'review', 'guide', 'tutorial', 'tips', '2026',
    'vs', 'alternative', 'free', 'price',
  ];
  
  const seeds = niche.split(',').map(s => s.trim()).filter(Boolean);
  const variations = [];
  
  for (const seed of seeds) {
    variations.push(seed);
    for (const mod of modifiers) {
      if (mod) variations.push(`${mod} ${seed}`);
    }
  }
  return variations;
}

/**
 * Discover keyword candidates from niche
 */
async function discoverKeywords(niche) {
  logger.info('Researching keywords from Google Suggest...');
  const seeds = generateSeedVariations(niche);
  const allSuggestions = new Set();
  
  // Get suggestions for first 8 seeds (avoid rate limit)
  for (const seed of seeds.slice(0, 8)) {
    const suggestions = await getGoogleSuggestions(seed);
    suggestions.forEach(s => allSuggestions.add(s.toLowerCase()));
    await new Promise(r => setTimeout(r, 300)); // gentle rate limit
  }
  
  return Array.from(allSuggestions);
}

/**
 * Use Claude to pick the BEST keyword for an article
 * - High commercial/informational value
 * - Not previously used
 * - Achievable difficulty
 */
async function pickBestKeyword(candidates, niche) {
  // Filter out already-used keywords
  const used = new Set(keywordStore.keys());
  const fresh = candidates.filter(k => !used.has(k));
  
  if (fresh.length === 0) {
    logger.warn('All keywords used! Generating fresh ones...');
    return null;
  }
  
  const systemPrompt = `You are an elite SEO strategist with deep expertise in keyword research and search intent analysis.

Your job: From a list of keyword candidates, pick the SINGLE BEST keyword for the next blog article. The website is in this niche: "${niche}"

Selection criteria (in priority order):
1. Search intent clarity (commercial > informational > navigational)
2. Long-tail (3-6 words is sweet spot)
3. Realistic to rank for (not "best seo tools" — too competitive; prefer specific angles)
4. Aligns with niche perfectly
5. Suggests potential for product mentions/sales

Return JSON only:
{
  "keyword": "exact chosen keyword",
  "intent": "commercial|informational|navigational",
  "estimated_difficulty": "low|medium|high",
  "search_intent_explanation": "why this keyword & what searchers want",
  "article_angle": "the specific angle/hook the article should take",
  "secondary_keywords": ["3-5 related keywords to weave in"]
}`;
  
  const userMessage = `Pick the best keyword from these candidates:\n\n${fresh.slice(0, 50).join('\n')}`;
  
  const result = await askJSON(systemPrompt, userMessage, { maxTokens: 1024 });
  return result.json;
}

/**
 * Main: Find and select a fresh keyword for the next article
 */
async function findNextKeyword() {
  const candidates = await discoverKeywords(config.content.niche);
  logger.info(`Discovered ${candidates.length} candidate keywords`);
  
  if (candidates.length === 0) {
    throw new Error('No keyword candidates found');
  }
  
  const chosen = await pickBestKeyword(candidates, config.content.niche);
  if (!chosen) throw new Error('Could not pick a keyword');
  
  logger.success(`Chosen keyword: "${chosen.keyword}" (${chosen.intent}, ${chosen.estimated_difficulty} difficulty)`);
  return chosen;
}

/**
 * Mark keyword as used
 */
function markUsed(keyword, articleId) {
  keywordStore.set(keyword.toLowerCase(), {
    used_at: new Date().toISOString(),
    article_id: articleId,
  });
}

module.exports = {
  findNextKeyword,
  markUsed,
  discoverKeywords,
};
