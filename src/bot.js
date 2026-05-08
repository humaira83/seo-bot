/**
 * Main Bot Orchestrator
 * Coordinates: keyword research → article writing → internal linking → publishing
 */
const { askJSON } = require('./lib/claude');
const { findNextKeyword, markUsed } = require('./lib/keywords');
const { getIndex, pickRelevantLinks } = require('./lib/linker');
const { createPost } = require('./lib/wordpress');
const { articleStore } = require('./lib/storage');
const { systemPrompt, articleRequest } = require('./prompts/article');
const { config, validate } = require('./config');
const logger = require('./lib/logger');

/**
 * Generate and publish ONE article end-to-end
 */
async function generateOneArticle() {
  logger.step('STEP 1', 'Refreshing internal link index');
  const index = await getIndex();
  
  logger.step('STEP 2', 'Researching keywords');
  const keyword = await findNextKeyword();
  
  logger.step('STEP 3', 'Picking relevant internal links');
  const relevantLinks = pickRelevantLinks(keyword.keyword, index, 8);
  logger.info(`Selected ${relevantLinks.length} relevant pages for internal linking`);
  
  logger.step('STEP 4', 'Generating article with Claude');
  logger.info(`Target: ${config.content.wordCount} words, ${config.content.language} language, ${config.content.tone} tone`);
  
  const userMsg = articleRequest({
    keyword: keyword.keyword,
    intent: keyword.search_intent_explanation,
    articleAngle: keyword.article_angle,
    secondaryKeywords: keyword.secondary_keywords,
    internalLinks: relevantLinks,
    products: index.products,
  });
  
  const result = await askJSON(systemPrompt(), userMsg, { maxTokens: 8192 });
  const article = result.json;
  
  logger.success(`Article written: "${article.title}"`);
  logger.info(`Word count: ~${article.word_count} | Internal links: ${article.internal_links_used?.length || 0}`);
  logger.info(`Tokens used: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out`);
  
  logger.step('STEP 5', 'Publishing to WordPress');
  const post = await createPost({
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    slug: article.slug,
    status: config.bot.postStatus,
    tags: [], // TODO: convert tag names to IDs
    meta: {
      // Yoast SEO
      _yoast_wpseo_title: article.title,
      _yoast_wpseo_metadesc: article.meta_description,
      _yoast_wpseo_focuskw: article.focus_keyword,
      // RankMath SEO
      rank_math_title: article.title,
      rank_math_description: article.meta_description,
      rank_math_focus_keyword: article.focus_keyword,
    },
  });
  
  logger.success(`Published! ID: ${post.id}, URL: ${post.link}`);
  
  // Track in storage
  markUsed(keyword.keyword, post.id);
  articleStore.set(post.id.toString(), {
    keyword: keyword.keyword,
    title: article.title,
    url: post.link,
    published_at: new Date().toISOString(),
    word_count: article.word_count,
    internal_links: article.internal_links_used,
  });
  
  return { article, post, keyword };
}

/**
 * Run daily generation (multiple articles)
 */
async function runDailyGeneration() {
  validate();
  
  const count = config.bot.articlesPerDay;
  logger.info(`\n🤖 SEO Bot starting daily run — generating ${count} article(s)\n`);
  
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      logger.info(`\n=== Article ${i + 1} of ${count} ===\n`);
      const result = await generateOneArticle();
      results.push({ success: true, ...result });
      
      // Small delay between articles
      if (i < count - 1) {
        logger.info('Waiting 30s before next article...');
        await new Promise(r => setTimeout(r, 30000));
      }
    } catch (err) {
      logger.error(`Failed to generate article ${i + 1}: ${err.message}`);
      results.push({ success: false, error: err.message });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  logger.info(`\n✨ Daily run complete: ${successful}/${count} articles published\n`);
  return results;
}

// CLI entry point
if (require.main === module) {
  const isOnce = process.argv.includes('--once');
  
  (async () => {
    try {
      if (isOnce) {
        await generateOneArticle();
      } else {
        await runDailyGeneration();
      }
      process.exit(0);
    } catch (err) {
      logger.error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { generateOneArticle, runDailyGeneration };
