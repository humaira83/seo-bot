const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Ubersuggest থেকে কি-ওয়ার্ড ডেটা স্ক্র্যাপ করার ফাংশন
 * @param {string} keyword - যে কি-ওয়ার্ডটি সার্চ করবেন
 */
async function getUbersuggestData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' // বট ডিটেকশন এড়ানোর জন্য
        ] 
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
        // cookies.json ফাইলটি রিড করা
        const cookiePath = path.join(__dirname, 'cookies.json');
        if (!fs.existsSync(cookiePath)) {
            throw new Error("cookies.json ফাইলটি src ফোল্ডারে পাওয়া যায়নি!");
        }

        let cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));

        // Playwright-এর রিকোয়ারমেন্ট অনুযায়ী কুকি ফরম্যাট ভ্যালিডেশন
        const validatedCookies = cookies.map(cookie => {
            const { hostOnly, expirationDate, session, sameSite, ...rest } = cookie;
            
            // sameSite ভ্যালু Strict, Lax, অথবা None হতে হবে (Case Sensitive)
            let validSameSite = "Lax";
            if (sameSite && ["Strict", "Lax", "None"].includes(sameSite.charAt(0).toUpperCase() + sameSite.slice(1).toLowerCase())) {
                validSameSite = sameSite.charAt(0).toUpperCase() + sameSite.slice(1).toLowerCase();
            }

            return {
                ...rest,
                sameSite: validSameSite,
                // নিশ্চিত করা যে ডোমেইন ডট (.) দিয়ে শুরু হচ্ছে কি না (প্রয়োজন ভেদে)
                domain: rest.domain.startsWith('.') ? rest.domain : rest.domain
            };
        });

        await context.addCookies(validatedCookies);

        const page = await context.newPage();
        console.log(`--- উবারসাজেস্ট সেশন শুরু: ${keyword} ---`);

        // সরাসরি কি-ওয়ার্ড ওভারভিউ পেজে যাওয়া (Location: 2840 = US, Language: en)
        const searchUrl = `https://app.neilpatel.com/en/ubersuggest/overview?keyword=${encodeURIComponent(keyword)}&loc=2840&lang=en`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
        
        // পেজ পুরোপুরি লোড এবং চার্ট রেন্ডার হওয়ার জন্য অপেক্ষা
        await page.waitForTimeout(7000); 

        // উবারসাজেস্টের ড্যাশবোর্ড থেকে ডেটা এক্সট্রাক্ট করা
        const data = await page.evaluate(() => {
            // মেট্রিক্স কার্ডের ভ্যালুগুলো সংগ্রহ (Volume, SEO Difficulty, CPC)
            const metrics = Array.from(document.querySelectorAll('.metrics-card__value, .ag-header-cell-text'));
            const values = metrics.map(m => m.innerText.trim());

            return {
                volume: values[0] || "N/A",
                difficulty: values[1] || "N/A",
                cpc: values[2] || "N/A",
                paid_difficulty: values[3] || "N/A"
            };
        });

        console.log("ডেটা সংগ্রহ সফল হয়েছে!");
        await browser.close();
        return { status: "success", keyword, ...data };

    } catch (error) {
        console.error("স্ক্র্যাপিং এরর ধরা পড়েছে:", error.message);
        await browser.close();
        return { status: "error", msg: error.message };
    }
}

module.exports = { getUbersuggestData };
