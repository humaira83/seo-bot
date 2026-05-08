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
        await page.goto('https://app.neilpatel.com/en/login', { waitUntil: 'networkidle', timeout: 60000 });
        
        // ইমেইল ইনপুট (আপনার দেওয়া সব অপশন ট্রাই করবে)
        const emailSelector = 'input[name="email"], input[placeholder="Email"], input[type="email"]';
        await page.waitForSelector(emailSelector);
        await page.fill(emailSelector, email);

        // পাসওয়ার্ড ইনপুট
        const passSelector = 'input[type="password"][name="password"], input[placeholder="Password"]';
        await page.fill(passSelector, password);

        // লগইন বাটন ক্লিক
        const loginBtn = '[data-testid="login-button"], button[type="submit"], button:has-text("Login")';
        await page.click(loginBtn);

        // লগইন সফল হওয়া পর্যন্ত অপেক্ষা
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        console.log("লগইন সফল হয়েছে!");

        // কি-ওয়ার্ড রিসার্চ পেজে যাওয়া
        const searchUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        await page.goto(searchUrl, { waitUntil: 'networkidle' });

        // ডেটা স্ক্র্যাপ করা (মেইন মেট্রিক্স কার্ড থেকে ডেটা নেওয়া)
        const data = await page.evaluate(() => {
            // উবারসাজেস্টের ড্যাশবোর্ড অনুযায়ী ক্লাস নেম বা টেক্সট দিয়ে সার্চ
            const metrics = document.querySelectorAll('.metrics-card__value');
            return {
                volume: metrics[0]?.innerText || "N/A",
                difficulty: metrics[1]?.innerText || "N/A",
                cpc: metrics[2]?.innerText || "N/A"
            };
        });

        await browser.close();
        return { status: "success", keyword, ...data };
    } catch (error) {
        console.error("স্ক্র্যাপিং এরর:", error);
        // এরর স্ক্রিনশট নেওয়া (ট্রাবলশুটিংয়ের জন্য ভালো)
        // await page.screenshot({ path: 'error.png' }); 
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getUbersuggestData };
