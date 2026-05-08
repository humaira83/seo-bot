const { getKeywordData } = require('./scraper');
const { getExistingSlugs } = require('./analyzer');
const { OpenAI } = require('openai');
const { config } = require('./config');
const logger = require('./lib/logger');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION & PATHS ---
const inventoryPath = path.join(__dirname, 'inventory.json');
// আপনার সাইটম্যাপের ইউআরএল এখানে চেক করুন
const SITEMAP_URL = `${config.wordpress.url}/post-sitemap.xml`; 

// --- Inventory Management Logic ---
function loadInventory() {
    if (!fs.existsSync(inventoryPath)) return { keywords: [], posted_urls: [] };
    try {
        return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    } catch (e) {
        return { keywords: [], posted_urls: [] };
    }
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
    - Search Volume: ${data.ubersuggest.volume}
    - SEO Difficulty: ${data.ubersuggest.difficulty}
    - Questions to Answer (Must include these): ${data.atp_questions.join(", ")}
    
    STRICT RULES:
    1. Human-like conversational tone (Expert Blogger style).
    2. Naturally promote MaximoHost.com for premium hosting or SEO group buy tools.
    3. Use H2/H3 tags, bold key terms, and create a comparison table.
    4. Provide actionable insights that solve user problems.
    
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
    
    // সাইটম্যাপ থেকে স্লাগগুলো নিয়ে আসা (ডুপ্লিকেট চেক করার জন্য)
    const existingSlugs = await getExistingSlugs(SITEMAP_URL);

    // ১. ইনভেন্টরিতে কোনো পেন্ডিং কি-ওয়ার্ড আছে কি না দেখা
    let targetTask = inventory.keywords.find(k => k.status === 'pending');

    // ২. যদি ইনভেন্টরি খালি থাকে, তবে নতুন রিসার্চ করা
    if (!targetTask) {
        logger.info('🔎 Inventory empty or completed. Researching new keyword set...');
        
        // এখানে আপনি আপনার নিশের একটি মেইন কি-ওয়ার্ড দিবেন
        const seedKeyword = "best group buy seo tools reviews"; 
        const researchData = await getKeywordData(seedKeyword);

        if (researchData.status === "success") {
            const newKeywordEntry = {
                q: seedKeyword,
                vol: researchData.ubersuggest.volume,
                difficulty: researchData.ubersuggest.difficulty,
                questions: researchData.atp_questions,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // সাইটম্যাপের সাথে ডুপ্লিকেট চেক (স্লাগ ফরম্যাটে)
            const slugifiedKeyword = seedKeyword.toLowerCase().replace(/\s+/g, '-');
            const isDuplicate = existingSlugs.some(slug => slug.includes(slugifiedKeyword));
            
            if (!isDuplicate) {
                inventory.keywords.push(newKeywordEntry);
                saveInventory(inventory);
                targetTask = newKeywordEntry;
                logger.info(`✅ New keyword added to inventory: ${seedKeyword}`);
            } else {
                logger.warn(`⚠️ Seed keyword "${seedKeyword}" already published. Trying to find another...`);
                return; 
            }
        }
    }

    // ৩. কি-ওয়ার্ড প্রসেস করা (আর্টিকেল লেখা)
    if (targetTask && targetTask.status === 'pending') {
        logger.info(`📝 Processing Article for: ${targetTask.q}`);
        
        const article = await generatePremiumContent(targetTask.q, {
            ubersuggest: { volume: targetTask.vol, difficulty: targetTask.difficulty },
            atp_questions: targetTask.questions
        });

        if (article) {
            // ইনভেন্টরি আপডেট করা
            targetTask.status = 'completed';
            inventory.posted_urls = inventory.posted_urls || [];
            inventory.posted_urls.push({
                keyword: targetTask.q,
                date: new Date().toISOString()
            });
            saveInventory(inventory);
            
            logger.info('✨ Article generated successfully!');
            console.log("\n--- Preview ---\n");
            console.log(article.substring(0, 500) + "...");
            
            // TODO: আপনার ওয়ার্ডপ্রেস পোস্টিং ফাংশন এখানে কল করুন
        }
    }
}

// Execution Trigger
if (require.main === module) {
    runDailyGeneration().catch(err => {
        logger.error(`Fatal System Error: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runDailyGeneration };
