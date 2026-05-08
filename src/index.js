const cron = require('node-cron');
const { runDailyGeneration } = require('./bot');
const { config, validate } = require('./config');
const logger = require('./lib/logger');
const { getKeywordData } = require('./scraper');

validate();

function timeToCron(hhmm) {
    const [hour, minute] = hhmm.split(':').map(Number);
    return `${minute} ${hour} * * *`;
}

const cronExpression = timeToCron(config.bot.dailyRunTime);

logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.info('    🤖 SEO BOT — STARTED');
logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// startup test
async function startupTest() {
    logger.info('🧪 Testing Scraper (Ubersuggest + ATP)...');
    try {
        const result = await getKeywordData("best group buy seo tools");
        logger.info(`✅ Data Received: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
        logger.error(`❌ Startup Test Failed: ${err.message}`);
    }
}
startupTest();

cron.schedule(cronExpression, async () => {
    logger.info('⏰ Cron triggered — starting daily generation');
    try {
        await runDailyGeneration();
    } catch (err) {
        logger.error(`Daily run failed: ${err.message}`);
    }
});

process.on('SIGINT', () => {
    logger.info('Shutting down...');
    process.exit(0);
});

setInterval(() => {}, 1000 * 60 * 60);
