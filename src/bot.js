const { getKeywordData } = require('./scraper');
const { getExistingSlugs } = require('./analyzer');
const { OpenAI } = require('openai');
const { config } = require('./config');
const logger = require('./lib/logger');
const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, 'inventory.json');

// --- Inventory Management Logic ---
function loadInventory() {
    if (!fs.existsSync(inventoryPath)) return { keywords: [], posted_urls: [] };
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
}

function saveInventory(data) {
    fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2));
}

// --- AI Content Writer ---
async function generatePremiumContent(keyword, data) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `
    You are an Expert SEO Strategist. Write a 1500+ word technical guide for: "${keyword}".
    
    CONTEXT:
    - Volume: ${data.ubersuggest.volume}, Difficulty: ${data.ubersuggest.difficulty}
    - Questions to Answer: ${data.atp_questions.join(", ")}
    
    STRICT RULES:
    1. Human-like conversational tone (Expert Blogger).
    2. Naturally promote MaximoHost.com for hosting/SEO tools.
    3. Use H2/H3 tags, bold keywords, and a comparison table.
    4. Provide actionable insights, not just surface-level info.
    
    Language: ${config.content.language || 'English'}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        return response.choices[0].message.content;
    } catch (err) {
        logger.error(`AI Writing Error: ${err.message}`);
        return null;
    }
}

// --- Main Automation Workflow ---
async function runDailyGeneration() {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🚀 ENTERPRISE SEO ENGINE ACTIVATED');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let inventory = loadInventory();
    const sitemapUrl = `${config.wordpress.url}/post-sitemap.xml`; // Change if needed
    const existingSlugs = await getExistingSlugs(sitemapUrl);

    // 1. Check if we have pending keywords in inventory
    let targetTask = inventory.keywords.find(k => k.status === 'pending');

    // 2. If no keywords or all done, research new ones
    if (!targetTask) {
        logger.info('🔎 Inventory empty or completed. Researching new keywords...');
        const seedKeyword = "best group buy seo tools"; // Base niche
        const researchData = await getKeywordData(seedKeyword);

        if (researchData.status === "success") {
            // Add new keywords to inventory (excluding duplicates from site)
            const newKeyword = {
                q: seedKeyword,
                vol: researchData.ubersuggest.volume,
                difficulty: researchData.ubersuggest.difficulty,
                questions: researchData.atp_questions,
                status: 'pending'
            };

            const isDuplicate = existingSlugs.some(slug => slug.includes(seedKeyword.replace(/\s+/g, '-')));
            
            if (!isDuplicate) {
                inventory.keywords.push(newKeyword);
                saveInventory(inventory);
                targetTask = newKeyword;
                logger.info(`✅ New keyword added to inventory: ${seedKeyword}`);
            } else {
                logger.warn(`⚠️ Seed keyword "${seedKeyword}" already exists on site. Adjusting...`);
                return; 
            }
        }
    }

    // 3. Process the selected keyword
    if (targetTask && targetTask.status === 'pending') {
        logger.info(`📝 Processing: ${targetTask.q}`);
        
        // Final check before writing
        const article = await generatePremiumContent(targetTask.q, {
            ubersuggest: { volume: targetTask.vol, difficulty: targetTask.difficulty },
            atp_questions: targetTask.questions
        });

        if (article) {
            // Update status in inventory
            targetTask.status = 'completed';
            saveInventory(inventory);
            
            logger.info('✨ Article generated successfully!');
            console.log("\n--- Article Preview ---\n");
            console.log(article.substring(0, 400) + "...");
            
            // TODO: Call your postToWordPress function here
        }
    }
}

// Trigger Execution
if (require.main === module) {
    runDailyGeneration().catch(err => {
        logger.error(`Fatal System Error: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runDailyGeneration };
