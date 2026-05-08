/**
 * Internal Linker
 * Builds index of existing posts/products and adds contextual links to new articles
 */
const { getAllPosts, getAllProducts } = require('./wordpress');
const { linkMap } = require('./storage');
const logger = require('./logger');

/**
 * Refresh the internal link index
 * Should be called once before article generation
 */
async function refreshIndex() {
  logger.info('Refreshing internal link index...');
  const [posts, products] = await Promise.all([
    getAllPosts(200),
    getAllProducts(100),
  ]);
  
  const index = {
    posts: posts.map(p => ({
      id: p.id,
      title: p.title?.rendered || '',
      url: p.link,
      slug: p.slug,
      type: 'post',
    })),
    products: products.map(p => ({
      id: p.id,
      title: p.title?.rendered || '',
      url: p.link,
      slug: p.slug,
      type: 'product',
    })),
    refreshed_at: new Date().toISOString(),
  };
  
  linkMap.set('index', index);
  logger.success(`Indexed ${index.posts.length} posts and ${index.products.length} products`);
  return index;
}

/**
 * Get the current index (or refresh if missing/stale)
 */
async function getIndex(maxAgeHours = 24) {
  const existing = linkMap.get('index');
  if (existing) {
    const age = (Date.now() - new Date(existing.refreshed_at).getTime()) / 1000 / 60 / 60;
    if (age < maxAgeHours) return existing;
  }
  return refreshIndex();
}

/**
 * Pick relevant pages from index to suggest as internal links
 * Uses simple keyword matching — Claude will then place them naturally
 */
function pickRelevantLinks(keyword, index, count = 7) {
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(/\s+/).filter(w => w.length > 3);
  
  const all = [...(index.posts || []), ...(index.products || [])];
  
  // Score each item by keyword overlap with title
  const scored = all.map(item => {
    const titleLower = item.title.toLowerCase();
    let score = 0;
    
    for (const word of keywordWords) {
      if (titleLower.includes(word)) score += 2;
    }
    if (titleLower.includes(keywordLower)) score += 5;
    
    // Boost products slightly (sales priority)
    if (item.type === 'product') score += 1;
    
    return { ...item, score };
  });
  
  // Sort and pick top N
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Format links for inclusion in article prompt
 */
function formatLinksForPrompt(links) {
  if (!links || links.length === 0) return 'No existing pages to link to yet.';
  
  return links.map(link => 
    `- ${link.type.toUpperCase()}: "${link.title}" → ${link.url}`
  ).join('\n');
}

module.exports = {
  refreshIndex,
  getIndex,
  pickRelevantLinks,
  formatLinksForPrompt,
};
