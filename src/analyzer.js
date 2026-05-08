const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const logger = require('./lib/logger');

async function getExistingSlugs(sitemapUrl) {
    try {
        logger.info(`🔍 Scanning Sitemap: ${sitemapUrl}`);
        const response = await axios.get(sitemapUrl, { timeout: 10000 });
        const parser = new XMLParser();
        let jObj = parser.parse(response.data);
        
        // সাইটম্যাপ থেকে সব URL বের করা
        let urls = [];
        if (jObj.urlset && jObj.urlset.url) {
            urls = Array.isArray(jObj.urlset.url) 
                ? jObj.urlset.url.map(u => u.loc) 
                : [jObj.urlset.url.loc];
        }

        // URL থেকে শুধু স্লাগ (slug) বের করা (ডুপ্লিকেট চেকিং সহজ হবে)
        const slugs = urls.map(url => {
            const parts = url.split('/').filter(p => p !== "");
            return parts[parts.length - 1].replace(/-/g, ' ');
        });

        logger.info(`✅ Found ${slugs.length} existing posts/pages.`);
        return slugs;
    } catch (e) {
        logger.error(`❌ Sitemap Scan Failed: ${e.message}`);
        return [];
    }
}

module.exports = { getExistingSlugs };
