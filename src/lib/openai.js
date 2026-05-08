/**
 * OpenAI API Wrapper
 * Same interface as claude.js — interchangeable
 */
const OpenAI = require('openai');
const { config } = require('../config');
const logger = require('./logger');

const client = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Send a message to OpenAI and get response
 */
async function ask(systemPrompt, userMessage, options = {}) {
  const maxTokens = options.maxTokens || 4096;
  const model = options.model || config.openai.model;
  
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    
    const text = response.choices[0]?.message?.content || '';
    
    return {
      text,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
      model: response.model,
    };
  } catch (err) {
    logger.error(`OpenAI API error: ${err.message}`);
    throw err;
  }
}

/**
 * Ask OpenAI for structured JSON output (uses native JSON mode)
 */
async function askJSON(systemPrompt, userMessage, options = {}) {
  const maxTokens = options.maxTokens || 4096;
  const model = options.model || config.openai.model;
  
  // OpenAI's JSON mode requires "JSON" mentioned in messages
  const enhancedSystem = systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no code fences.';
  
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: enhancedSystem },
        { role: 'user', content: userMessage },
      ],
    });
    
    const text = response.choices[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      logger.error(`Failed to parse JSON: ${e.message}`);
      logger.error(`Raw text: ${text.slice(0, 500)}`);
      throw e;
    }
    
    return {
      text,
      json: parsed,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
      model: response.model,
    };
  } catch (err) {
    logger.error(`OpenAI API error: ${err.message}`);
    throw err;
  }
}

// CLI test
if (require.main === module && process.argv.includes('--test')) {
  (async () => {
    logger.info('Testing OpenAI API...');
    try {
      const result = await ask(
        'You are a helpful assistant.',
        'Say "API working!" in exactly 3 words.'
      );
      logger.success(`Response: ${result.text}`);
      logger.success(`Tokens: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out`);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  })();
}

module.exports = { ask, askJSON };
