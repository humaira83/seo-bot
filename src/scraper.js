const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Loads cookies from separate JSON files for Ubersuggest and ATP
 */
async function loadCookies(context, fileName) {
    try {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8').trim();
            if (rawData && rawData !== "[]") {
                const cookies = JSON.parse(rawData);
                const validatedCookies = cookies.map(c => ({
                    ...c,
                    sameSite: ["Strict", "Lax", "None"].includes(c.sameSite) ? c.sameSite : "Lax"
                }));
                await context.addCookies(validatedCookies);
                console.log(`✅ Cookie Success: ${fileName} loaded.`);
            }
        }
    } catch (error) {
        console.error(`❌ Cookie Error (${fileName}): ${error.message}`);
    }
}

/**
 * Main Scraper Function
 */
async function getKeywordData(keyword) {
    // Launching with no-sandbox for VPS compatibility (OVH/Coolify)
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    try {
        await loadCookies(context, 'ubersuggest_cookies.json');
        await loadCookies(context, 'atp_cookies.json');
        const page = await context.newPage();

        // --- Ubersuggest Research ---
        console.log(`🔍 Researching Ubersuggest: ${keyword}`);
        const ubersuggestUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        
        // Use 'domcontentloaded' to bypass slow trackers that cause timeouts
        await page.goto(ubersuggestUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 45000 
        });

        // Give the JavaScript a moment to render the metrics
        await page.waitForTimeout(12000); 

        const ubersuggestData = await page.evaluate(() => {
            const getVal = (idx) => {
                const selectors = [
                    '[data-testid="metrics-card-value"]', 
                    '.metrics-card__value', 
                    '.h-m-0.font-weight-bold'
                ];
                for (let s of selectors) {
                    const el = document.querySelectorAll(s)[idx];
                    if (el && el.innerText.trim() !== "") return el.innerText.trim();
                }
                return "N/A";
            };
            return {
                volume: getVal(0),
                difficulty: getVal(1),
                cpc: getVal(2)
            };
        });

        // --- AnswerThePublic Research ---
        console.log(`🔍 Fetching Questions from AnswerThePublic...`);
        const atpUrl = `https://answerthepublic.com/reports/new?q=${encodeURIComponent(keyword)}`;
        
        await page.goto(atpUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        await page.waitForTimeout(8000);

        const questions = await page.evaluate(() => {
            const selectors = ['.result-grid__item-text', '.question-node-text', 'text.node-text'];
            let found = [];
            for (let s of selectors) {
                const items = Array.from(document.querySelectorAll(s)).slice(0, 8);
                if (items.length > 0) {
                    found = items.map(i => i.innerText.trim());
                    break;
                }
            }
            return found;
        });

        // Safe Fallback for Questions
        const finalQuestions = questions.length > 0 ? questions : [`How to start with ${keyword}?`, `Best tips for ${keyword} in 2026` ];

        await browser.close();
        return { 
            status: "success", 
            keyword, 
            ubersuggest: ubersuggestData, 
            atp_questions: finalQuestions 
        };

    } catch (error) {
        console.error(`❌ Scraper Critical Failure: ${error.message}`);
        if (browser) await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getKeywordData };
