const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function loadCookies(context, fileName) {
    try {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            let rawData = fs.readFileSync(filePath, 'utf8').trim();
            if (rawData && rawData !== "[]") {
                let cookies = JSON.parse(rawData);
                const validatedCookies = cookies.map(c => ({
                    ...c,
                    sameSite: ["Strict", "Lax", "None"].includes(c.sameSite) ? c.sameSite : "Lax"
                }));
                await context.addCookies(validatedCookies);
                console.log(`✅ ${fileName} লোড হয়েছে।`);
            }
        }
    } catch (error) {
        console.error(`❌ ${fileName} এরর: ${error.message}`);
    }
}

async function getKeywordData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });

    try {
        await loadCookies(context, 'ubersuggest_cookies.json');
        await loadCookies(context, 'atp_cookies.json');

        const page = await context.newPage();
        
        // --- উবারসাজেস্ট রিসার্চ ---
        console.log(`Ubersuggest শুরু: ${keyword}`);
        const ubersuggestUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(ubersuggestUrl, { waitUntil: 'networkidle', timeout: 60000 });
        
        // ডেটা লোড হওয়ার জন্য একটু স্ক্রল এবং ১০ সেকেন্ড অপেক্ষা
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(10000);

        const ubersuggestData = await page.evaluate(() => {
            const metrics = Array.from(document.querySelectorAll('.metrics-card__value, .metrics-card div[class*="value"]'));
            return {
                volume: metrics[0]?.innerText?.trim() || "N/A",
                difficulty: metrics[1]?.innerText?.trim() || "N/A",
                cpc: metrics[2]?.innerText?.trim() || "N/A"
            };
        });

        // --- ATP রিসার্চ ---
        console.log(`AnswerThePublic শুরু...`);
        const atpUrl = `https://answerthepublic.com/reports/new?q=${encodeURIComponent(keyword)}`;
        await page.goto(atpUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(8000);

        const questions = await page.evaluate(() => {
            // ATP এর নতুন ক্লাস সিলেক্টর
            const items = Array.from(document.querySelectorAll('.result-grid__item-text, .question-node-text')).slice(0, 10);
            return items.length > 0 ? items.map(i => i.innerText.trim()) : ["No questions found"];
        });

        await browser.close();
        return { status: "success", keyword, ubersuggest: ubersuggestData, atp_questions: questions };

    } catch (error) {
        console.error("স্ক্র্যাপিং এরর:", error.message);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getKeywordData };
