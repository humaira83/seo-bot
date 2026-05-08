const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// কুকি লোড করার জন্য একটি কমন ফাংশন
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
                console.log(`✅ ${fileName} থেকে কুকি লোড হয়েছে।`);
            }
        }
    } catch (error) {
        console.error(`❌ ${fileName} লোড করতে সমস্যা: ${error.message}`);
    }
}

async function getKeywordData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
        // আলাদা আলাদা ফাইল থেকে কুকি লোড করা
        await loadCookies(context, 'ubersuggest_cookies.json');
        await loadCookies(context, 'atp_cookies.json');

        const page = await context.newPage();
        
        // ১. উবারসাজেস্ট পার্ট
        console.log(`Ubersuggest রিসার্চ শুরু: ${keyword}`);
        const ubersuggestUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(ubersuggestUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(10000); // ডেটা লোড হওয়ার সময় দিন

        const ubersuggestData = await page.evaluate(() => {
            const metrics = document.querySelectorAll('.metrics-card__value');
            return {
                volume: metrics[0]?.innerText?.trim() || "N/A",
                difficulty: metrics[1]?.innerText?.trim() || "N/A",
                cpc: metrics[2]?.innerText?.trim() || "N/A"
            };
        });

        // ২. AnswerThePublic পার্ট
        console.log(`AnswerThePublic রিসার্চ শুরু...`);
        const atpUrl = `https://answerthepublic.com/reports/new?q=${encodeURIComponent(keyword)}`;
        await page.goto(atpUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(7000);

        const questions = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.result-grid__item-text')).slice(0, 10);
            return items.map(i => i.innerText.trim());
        });

        await browser.close();
        return { 
            status: "success", 
            keyword, 
            ubersuggest: ubersuggestData, 
            atp_questions: questions 
        };

    } catch (error) {
        console.error("স্ক্র্যাপিং এরর:", error.message);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getKeywordData };
