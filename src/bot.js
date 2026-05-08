const { getKeywordData } = require('./scraper');
const logger = require('./lib/logger');

async function runDailyGeneration() {
    logger.info('🚀 এসইও ওয়ার্কফ্লো শুরু হচ্ছে...');

    // ১. কি-ওয়ার্ড সিলেকশন (এটি আপনি আপনার ডেটাবেস বা লিস্ট থেকে নিতে পারেন)
    const seedKeyword = "best group buy seo tools 2026"; 

    // ২. স্ক্র্যাপার চালানো (Ubersuggest + ATP একসাথেই ডেটা আনবে)
    const data = await getKeywordData(seedKeyword);

    if (data.status === "success") {
        const { volume, difficulty } = data.ubersuggest;
        const questions = data.atp_questions;

        // ৩. কি-ওয়ার্ড চেক (ভলিউম N/A হলে বা খুব কম হলে চাইলে স্কিপ করতে পারেন)
        logger.info(`📊 কি-ওয়ার্ড: ${seedKeyword} | Volume: ${volume} | Difficulty: ${difficulty}`);

        if (questions.length > 0) {
            logger.info(`📝 ${questions.length}টি প্রশ্ন পাওয়া গেছে। আর্টিকেল জেনারেট হচ্ছে...`);
            
            // ৪. এখানে আপনার AI Writing ফাংশন কল হবে (যেখানে questions গুলো প্রম্পট হিসেবে যাবে)
            // const article = await generateArticle(seedKeyword, data);
            
            logger.info('✅ আর্টিকেল সফলভাবে তৈরি এবং ড্রাফট হিসেবে সেভ হয়েছে।');
        } else {
            logger.warn('⚠️ পর্যাপ্ত প্রশ্ন পাওয়া যায়নি, অন্য কি-ওয়ার্ড ট্রাই করুন।');
        }
    } else {
        logger.error('❌ স্ক্র্যাপার ডেটা আনতে পারেনি। কুকি চেক করুন।');
    }
}

module.exports = { runDailyGeneration };
