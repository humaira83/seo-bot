/**
 * WordPress REST API Client
 * Uses Application Passwords for authentication
 */
const axios = require('axios');
const { config } = require('../config');
const logger = require('./logger');

const baseURL = `${config.wordpress.url}/wp-json/wp/v2`;
const auth = {
  username: config.wordpress.username,
  password: config.wordpress.appPassword,
};

const api = axios.create({
  baseURL,
  auth,
  timeout: 30000,
});

/**
 * Get all published posts (for internal linking)
 */
async function getAllPosts(limit = 100) {
  try {
    const posts = [];
    let page = 1;
    let perPage = Math.min(100, limit);
    
    while (posts.length < limit) {
      const res = await api.get('/posts', {
        params: { per_page: perPage, page, status: 'publish,draft', _fields: 'id,title,link,slug,excerpt' }
      });
      if (!res.data || res.data.length === 0) break;
      posts.push(...res.data);
      if (res.data.length < perPage) break;
      page++;
    }
    return posts.slice(0, limit);
  } catch (err) {
    logger.error(`Failed to fetch posts: ${err.message}`);
    return [];
  }
}

/**
 * Get all products (works with WooCommerce or custom post type)
 */
async function getAllProducts(limit = 100) {
  // Try WooCommerce first
  try {
    const res = await api.get('/product', {
      params: { per_page: limit, _fields: 'id,title,link,slug,excerpt' }
    });
    return res.data || [];
  } catch (err) {
    // Try custom post type
    try {
      const res = await api.get('/tools', {
        params: { per_page: limit, _fields: 'id,title,link,slug,excerpt' }
      });
      return res.data || [];
    } catch (e) {
      logger.warn('Could not fetch products from /product or /tools endpoint');
      return [];
    }
  }
}

/**
 * Create a new post
 */
async function createPost({ title, content, excerpt, slug, status, categories, tags, meta }) {
  try {
    const payload = {
      title,
      content,
      excerpt: excerpt || '',
      slug: slug || '',
      status: status || config.bot.postStatus,
      categories: categories || (config.bot.defaultCategory ? [config.bot.defaultCategory] : []),
      tags: tags || [],
      author: config.bot.defaultAuthor,
    };
    
    // Add Yoast/RankMath SEO meta if provided
    if (meta) payload.meta = meta;
    
    const res = await api.post('/posts', payload);
    return res.data;
  } catch (err) {
    logger.error(`Failed to create post: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

/**
 * Update existing post (for product optimization phase)
 */
async function updatePost(id, data) {
  try {
    const res = await api.post(`/posts/${id}`, data);
    return res.data;
  } catch (err) {
    logger.error(`Failed to update post ${id}: ${err.message}`);
    throw err;
  }
}

/**
 * Get or create tag by name
 */
async function getOrCreateTag(name) {
  try {
    const search = await api.get('/tags', { params: { search: name } });
    if (search.data.length > 0) return search.data[0];
    
    const created = await api.post('/tags', { name });
    return created.data;
  } catch (err) {
    return null;
  }
}

/**
 * Test connection
 */
async function testConnection() {
  try {
    const res = await api.get('/users/me');
    return {
      success: true,
      user: res.data.name,
      role: res.data.roles?.[0],
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message,
    };
  }
}

// CLI test
if (require.main === module && process.argv.includes('--test')) {
  (async () => {
    logger.info('Testing WordPress connection...');
    const result = await testConnection();
    if (result.success) {
      logger.success(`Connected as: ${result.user} (${result.role})`);
      const posts = await getAllPosts(5);
      logger.info(`Found ${posts.length} recent posts`);
      const products = await getAllProducts(5);
      logger.info(`Found ${products.length} products`);
    } else {
      logger.error(`Failed: ${result.error}`);
      process.exit(1);
    }
  })();
}

module.exports = {
  getAllPosts,
  getAllProducts,
  createPost,
  updatePost,
  getOrCreateTag,
  testConnection,
};
