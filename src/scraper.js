const { chromium } = require('playwright');

async function getUbersuggestData(keyword, email, password) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Ubersuggest-এ লগইন করার চেষ্টা করছি...");
        await page.goto('https://app.neilpatel.com/en/login', { waitUntil: 'networkidle' });
        
        // লগইন ফর্ম ফিলআপ
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        // লগইন হওয়া পর্যন্ত অপেক্ষা
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        console.log("লগইন সফল হয়েছে!");

        // কি-ওয়ার্ড রিসার্চ পেজে যাওয়া (উবুন্টু লোকেশন সেট করা আছে)
        const searchUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(searchUrl, { waitUntil: 'networkidle' });

        // ডেটা স্ক্র্যাপ করা (এখানে আমরা সার্চ ভলিউম এবং সিপিসি নিচ্ছি)
        const data = await page.evaluate(() => {
            return {
                volume: document.querySelector('.metrics-card__value')?.innerText || "N/A",
                difficulty: document.querySelector('.difficulty-badge')?.innerText || "N/A"
            };
        });

        await browser.close();
        return { status: "success", keyword, ...data };
    } catch (error) {
        console.error("স্ক্র্যাপিং এরর:", error);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getUbersuggestData };
