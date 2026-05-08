const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function getKeywordData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
        const cookiePath = path.join(__dirname, 'cookies.json');
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        
        // কুকি ফরম্যাট ফিক্স করা
        const validatedCookies = cookies.map(c => ({
            ...c,
            sameSite: ["Strict", "Lax", "None"].includes(c.sameSite) ? c.sameSite : "Lax"
        }));
        await context.addCookies(validatedCookies);

        const page = await context.newPage();
        
        // --- ১. উবারসাজেস্ট (Ubersuggest) পার্ট ---
        console.log(`Ubersuggest রিসার্চ শুরু: ${keyword}`);
        const ubersuggestUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(ubersuggestUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(10000); // লোড হওয়ার জন্য একটু বেশি সময় দেওয়া

        const ubersuggestData = await page.evaluate(() => {
            const metrics = document.querySelectorAll('.metrics-card__value');
            return {
                volume: metrics[0]?.innerText?.trim() || "N/A",
                difficulty: metrics[1]?.innerText?.trim() || "N/A",
                cpc: metrics[2]?.innerText?.trim() || "N/A"
            };
        });

        // --- ২. অ্যানসার-দ্য-পাবলিক (ATP) পার্ট ---
        console.log(`AnswerThePublic রিসার্চ শুরু...`);
        const atpUrl = `https://answerthepublic.com/reports/new?q=${encodeURIComponent(keyword)}`;
        await page.goto(atpUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);

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
        console.error("এরর:", error.message);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getKeywordData };
