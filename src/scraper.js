const { chromium } = require('playwright');

async function getKeywordData(keyword) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    console.log(`স্ক্র্যাপার শুরু হচ্ছে কি-ওয়ার্ড: ${keyword}`);
    await browser.close();
    return { status: "ready" };
}

module.exports = { getKeywordData };
