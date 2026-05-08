const { getKeywordData } = require('./scraper');
const { getExistingSlugs } = require('./analyzer');
const { OpenAI } = require('openai');
const { config } = require('./config');
const logger = require('./lib/logger');
const fs = require('fs');
const path = require('path');

// --- PATHS & CONSTANTS ---
const inventoryPath = path.join(__dirname, 'inventory.json');
const SITEMAP_URL = `${config.wordpress.url}/post-sitemap.xml`; // RankMath/Yoast default

// --- 1. Inventory Logic (The Brain) ---
function loadInventory() {
    if (!fs.existsSync(inventoryPath)) {
        return { keywords: [], posted_history: [] };
    }
    try {
        return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    } catch (e) {
        return { keywords: [], posted_history: [] };
    }
}

function saveInventory(data) {
    fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2));
}

// --- 2. Premium AI Writer ---
async function generatePremiumContent(keyword, data) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    logger.info(`✍️ GPT-4o is crafting article: ${keyword}`);

    const prompt = `
    You are a Senior SEO Expert. Write a 1500+ word, high-value technical guide for: "${keyword}".
    
    MARKET DATA:
    - Search Volume: ${data.ubersuggest.volume || 'N/A'}
    - Difficulty: ${data.ubersuggest.difficulty || 'N/A'}
    - User Questions to Answer: ${data.atp_questions.join(", ")}
    
    CONTENT REQUIREMENTS:
    1. Introduction: Hook the reader with expert insights (No generic AI fluff).
    2. Deep Dive: Answer the questions from AnswerThePublic thoroughly.
    3. Branding: Naturally integrate MaximoHost.com as the best solution for hosting and SEO group buy tools.
    4. Formatting: Use professional H2/H3 headers, bold terms, and comparison tables.
    5. Call to Action: Professional ending encouraging users to try MaximoHost.
    
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

// --- 3. Main Automation Engine ---
async function runDailyGeneration() {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🚀 ENTERPRISE SEO ENGINE ACTIVATED');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let inventory = loadInventory();
    
    // Step A: Analysis - Get existing posts from sitemap
    const existingSlugs = await getExistingSlugs(SITEMAP_URL);

    // Step B: Pick next pending task
    let targetTask = inventory.keywords.find(k => k.status === 'pending');

    // Step C: If Inventory is empty, Research New Keywords (Ubersuggest + ATP)
    if (!targetTask) {
        logger.info('🔎 Inventory dry. Launching new research phase...');
        
        // You can change this seed keyword to anything you want
        const seedKeyword = "best group buy seo tools reviews"; 
        const researchData = await getKeywordData(seedKeyword);

        if (researchData.status === "success") {
            const slugified = seedKeyword.toLowerCase().replace(/\s+/g, '-');
            
            // Check if we already have this on the website
            const alreadyPublished = existingSlugs.some(slug => slug.includes(slugified));
            
            if (!alreadyPublished) {
                targetTask = {
                    q: seedKeyword,
                    vol: researchData.ubersuggest.volume,
                    difficulty: researchData.ubersuggest.difficulty,
                    questions: researchData.atp_questions,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                inventory.keywords.push(targetTask);
                saveInventory(inventory);
                logger.info(`✅ New research saved to inventory: ${seedKeyword}`);
            } else {
                logger.warn(`⚠️ "${seedKeyword}" already exists on site. Researching next...`);
                // Optional: You can trigger more research here
                return;
            }
        } else {
            logger.error(`❌ Research Failed: ${researchData.msg}`);
            return;
        }
    }

    // Step D: Generate Content for the Task
    if (targetTask && targetTask.status === 'pending') {
        logger.info(`📝 Processing Article: ${targetTask.q}`);
        
        const articleContent = await generatePremiumContent(targetTask.q, {
            ubersuggest: { volume: targetTask.vol, difficulty: targetTask.difficulty },
            atp_questions: targetTask.questions
        });

        if (articleContent) {
            // Update Inventory Status
            targetTask.status = 'completed';
            inventory.posted_history = inventory.posted_history || [];
            inventory.posted_history.push({
                keyword: targetTask.q,
                date: new Date().toISOString()
            });
            saveInventory(inventory);
            
            logger.info('✨ Article Generation Complete!');
            console.log("\n--- Preview ---\n");
            console.log(articleContent.substring(0, 500) + "...");
            
            // Step E: WordPress Posting (Import your WP module if ready)
            try {
                const wp = require('./lib/wordpress'); // Make sure this file exists
                const result = await wp.createPost({
                    title: targetTask.q.toUpperCase(),
                    content: articleContent,
                    status: config.bot.postStatus || 'draft'
                });
                if (result) logger.info(`✅ Posted to WordPress (ID: ${result.id})`);
            } catch (wpErr) {
                logger.error(`WordPress Upload Failed: ${wpErr.message}`);
            }
        }
    }
}

// Trigger Trigger
if (require.main === module) {
    runDailyGeneration().catch(err => {
        logger.error(`Fatal Error: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runDailyGeneration };
