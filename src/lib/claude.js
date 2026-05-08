/**
 * Claude API Wrapper
 * Uses official Anthropic SDK
 */
const Anthropic = require('@anthropic-ai/sdk');
const { config } = require('../config');
const logger = require('./logger');

const client = new Anthropic({ apiKey: config.claude.apiKey });

/**
 * Send a message to Claude and get response
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User query
 * @param {object} options - { maxTokens, model }
 */
async function ask(systemPrompt, userMessage, options = {}) {
  const maxTokens = options.maxTokens || 4096;
  const model = options.model || config.claude.model;
  
  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    
    return {
      text,
      usage: response.usage,
      model: response.model,
    };
  } catch (err) {
    logger.error(`Claude API error: ${err.message}`);
    throw err;
  }
}

/**
 * Ask Claude for structured JSON output
 */
async function askJSON(systemPrompt, userMessage, options = {}) {
  const fullSystem = systemPrompt + '\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code fences, no explanation.';
  const result = await ask(fullSystem, userMessage, options);
  
  let cleanText = result.text.trim();
  // Remove markdown code fences if present
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  try {
    return { ...result, json: JSON.parse(cleanText) };
  } catch (e) {
    logger.error(`Failed to parse JSON: ${e.message}`);
    logger.error(`Raw text: ${cleanText.slice(0, 500)}`);
    throw e;
  }
}

// CLI test
if (require.main === module && process.argv.includes('--test')) {
  (async () => {
    logger.info('Testing Claude API...');
    try {
      const result = await ask(
        'You are a helpful assistant.',
        'Say "API working!" in exactly 3 words.'
      );
      logger.success(`Response: ${result.text}`);
      logger.success(`Tokens used: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out`);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  })();
}

module.exports = { ask, askJSON };
