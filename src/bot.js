const { getKeywordData } = require('./scraper');
const { OpenAI } = require('openai');
const { config } = require('./config');
const logger = require('./lib/logger');

// ১. প্রিমিয়াম আর্টিকেল জেনারেশন লজিক
async function generatePremiumContent(keyword, data) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    logger.info(`✍️ GPT-4o দিয়ে আর্টিকেল লেখা হচ্ছে: ${keyword}`);

    const prompt = `
    You are a professional SEO Content Writer. Write a 1500+ word deep-dive article.
    
    KEYWORD DATA:
    - Primary Keyword: ${keyword}
    - Search Volume: ${data.ubersuggest.volume}
    - SEO Difficulty: ${data.ubersuggest.difficulty}
    
    AUDIENCE QUESTIONS (Use these as Subheadings/H2/H3):
    ${data.atp_questions.join("\n")}

    STRUCTURE & RULES:
    1. Introduction: Hook the reader immediately. No robotic "In the digital world" phrases.
    2. Context: Explain why this keyword matters based on search volume.
    3. Deep Dive: Answer the questions gathered from AnswerThePublic with expert-level insights.
    4. Mention MaximoHost (our brand) naturally as a solution for high-performance hosting or group buy tools.
    5. Formatting: Use bullet points, bold text, and a comparison table.
    6. Tone: Human-like, helpful, and authoritative.
    
    Language: ${config.content.language || 'English'}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        return response.choices[0].message.content;
    } catch (err) {
        logger.error(`AI Writing Error: ${err.message}`);
        return null;
    }
}

// ২. মেইন অটোমেশন ওয়ার্কফ্লো
async function runDailyGeneration() {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🚀 এসইও কন্টেন্ট ওয়ার্কফ্লো শুরু হচ্ছে...');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // টেস্ট বা শিডিউল কি-ওয়ার্ড (এটি আপনি পরে ডাইনামিক করতে পারবেন)
    const targetKeyword = "best group buy seo tools reviews"; 

    // ধাপ ১: স্ক্র্যাপার থেকে ডেটা সংগ্রহ
    const scrapedData = await getKeywordData(targetKeyword);

    if (scrapedData.status === "success") {
        logger.info(`✅ ডেটা পাওয়া গেছে! ভলিউম: ${scrapedData.ubersuggest.volume}`);

        // ধাপ ২: আর্টিকেল জেনারেশন
        const finalArticle = await generatePremiumContent(targetKeyword, scrapedData);

        if (finalArticle) {
            logger.info('✨ প্রিমিয়াম আর্টিকেল জেনারেট হয়েছে!');
            
            // ধাপ ৩: এখানে আপনার ওয়ার্ডপ্রেস পোস্টিং ফাংশনটি কল করুন
            // await postToWordPress(targetKeyword, finalArticle);
            
            console.log("\n--- জেনারেটেড আর্টিকেলের প্রথম ৫০০ ক্যারেক্টার ---\n");
            console.log(finalArticle.substring(0, 500) + "...");
        }
    } else {
        logger.error(`❌ স্ক্র্যাপার ফেইল করেছে: ${scrapedData.msg}`);
    }
}

// ৩. টার্মিনাল থেকে সরাসরি রান করার জন্য কল
if (require.main === module) {
    runDailyGeneration().catch(err => {
        logger.error(`Fatal Error: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runDailyGeneration };
