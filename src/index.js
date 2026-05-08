/**
 * SEO Bot - Main Entry Point
 * Runs on a schedule (cron) and generates articles automatically
 */
const cron = require('node-cron');
const { runDailyGeneration } = require('./bot');
const { config, validate } = require('./config');
const logger = require('./lib/logger');

// Validate config on startup
validate();

// Convert HH:MM to cron expression
function timeToCron(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number);
  return `${minute} ${hour} * * *`;
}

const cronExpression = timeToCron(config.bot.dailyRunTime);

logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.info('   🤖 SEO BOT — STARTED');
logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.info(`Site: ${config.wordpress.url}`);
logger.info(`Schedule: Every day at ${config.bot.dailyRunTime} (cron: ${cronExpression})`);
logger.info(`Articles per day: ${config.bot.articlesPerDay}`);
logger.info(`Post status: ${config.bot.postStatus}`);
logger.info(`Language: ${config.content.language}`);
logger.info(`Niche: ${config.content.niche}`);
logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
logger.info('Bot is now waiting for the next scheduled run...');
logger.info('To trigger manually: npm run generate\n');

// Schedule daily run
cron.schedule(cronExpression, async () => {
  logger.info('⏰ Cron triggered — starting daily generation');
  try {
    await runDailyGeneration();
  } catch (err) {
    logger.error(`Daily run failed: ${err.message}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

// Keep process alive
setInterval(() => {}, 1000 * 60 * 60);
