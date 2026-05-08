const { getKeywordData } = require('./scraper');
const { OpenAI } = require('openai'); // আপনার যদি অন্য প্রোভাইডার থাকে তবে সেটি হবে
const { config } = require('./config');
const logger = require('./lib/logger');

// আর্টিকেল জেনারেশন ফাংশন (প্রিমিয়াম প্রম্পট সহ)
async function generatePremiumArticle(keyword, scrapedData) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
    You are a world-class SEO strategist and professional tech blogger.
    Write a high-value, comprehensive article for: "${keyword}".

    USE THIS DATA:
    - Search Volume: ${scrapedData.ubersuggest.volume}
    - Difficulty: ${scrapedData.ubersuggest.difficulty}
    - People Also Ask (Questions): ${scrapedData.atp_questions.join(", ")}

    WRITING GUIDELINES:
    1. Tone: Professional, expert, and helpful. Avoid robotic/generic intro.
    2. Structure: Use H2 and H3 tags. Naturally integrate the "People Also Ask" questions as subheadings.
    3. Authenticity: Talk like a human who has actually tested these tools. Mention MaximoHost (our brand) where relevant.
    4. Quality: No fluff. Each paragraph must provide real insight.
    5. Formatting: Use bullet points and tables for comparison.
    
    Language: ${config.content.language}
    Target Word Count: 1500+ words.
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o", // অথবা আপনার পছন্দমতো মডেল
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
    });

    return response.choices[0].message.content;
}

// ডেইলি জেনারেশন লজিক
async function runDailyGeneration() {
    logger.info('Starting premium content workflow...');
    // আপনার কি-ওয়ার্ড লিস্ট থেকে কি-ওয়ার্ড নেওয়ার লজিক এখানে থাকবে
    const keyword = "semrush group buy reviews"; 
    
    const scrapedData = await getKeywordData(keyword);
    
    if (scrapedData.status === "success") {
        const article = await generatePremiumArticle(keyword, scrapedData);
        logger.info('Article generation complete!');
        // এখানে আপনার ওয়ার্ডপ্রেস পোস্টিং লজিক থাকবে
    } else {
        logger.error('Failed to scrape data for article context.');
    }
}

module.exports = { runDailyGeneration };
