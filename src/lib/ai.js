/**
 * AI Provider Router
 * 
 * Switches between Claude and OpenAI based on AI_PROVIDER env var.
 * Both providers expose the same interface: ask() and askJSON()
 * 
 * Usage in other files:
 *   const { ask, askJSON } = require('./lib/ai');
 * 
 * Switch provider by changing AI_PROVIDER in .env (no code change needed)
 */
const { config } = require('../config');
const logger = require('./logger');

const provider = config.aiProvider;

let aiModule;

if (provider === 'openai') {
  if (!config.openai.apiKey) {
    throw new Error('AI_PROVIDER=openai but OPENAI_API_KEY is not set');
  }
  aiModule = require('./openai');
  logger.info(`AI Provider: OpenAI (model: ${config.openai.model})`);
} else if (provider === 'claude') {
  if (!config.claude.apiKey) {
    throw new Error('AI_PROVIDER=claude but CLAUDE_API_KEY is not set');
  }
  aiModule = require('./claude');
  logger.info(`AI Provider: Claude (model: ${config.claude.model})`);
} else {
  throw new Error(`Invalid AI_PROVIDER: "${provider}". Use "claude" or "openai"`);
}

module.exports = aiModule;
