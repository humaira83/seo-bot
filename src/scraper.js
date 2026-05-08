const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function getUbersuggestData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const context = await browser.newContext();

    try {
        // cookies.json ফাইলটি রিড করা
        const cookiePath = path.join(__dirname, 'cookies.json');
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        await context.addCookies(cookies);

        const page = await context.newPage();
        console.log(`কুকি ব্যবহার করে উবারসাজেস্টে প্রবেশ করছি: ${keyword}`);

        const searchUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(searchUrl, { waitUntil: 'networkidle' });

        // ডেটা স্ক্র্যাপ করা
        const data = await page.evaluate(() => {
            const metrics = document.querySelectorAll('.metrics-card__value');
            return {
                volume: metrics[0]?.innerText || "N/A",
                difficulty: metrics[1]?.innerText || "N/A"
            };
        });

        await browser.close();
        return { status: "success", keyword, ...data };
    } catch (error) {
        console.error("কুকি দিয়ে স্ক্র্যাপিং ফেইল করেছে:", error);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getUbersuggestData };
