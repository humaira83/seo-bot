/**
 * Simple logger with colors and file output
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../data/logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function logToFile(level, message) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOG_DIR, `${date}.log`);
  fs.appendFileSync(file, `[${timestamp()}] [${level}] ${message}\n`);
}

const logger = {
  info: (msg) => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`);
    logToFile('INFO', msg);
  },
  success: (msg) => {
    console.log(`${colors.green}[✓]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`);
    logToFile('SUCCESS', msg);
  },
  warn: (msg) => {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`);
    logToFile('WARN', msg);
  },
  error: (msg) => {
    console.log(`${colors.red}[ERROR]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`);
    logToFile('ERROR', msg);
  },
  step: (step, msg) => {
    console.log(`\n${colors.cyan}━━━ ${step} ━━━${colors.reset}\n${msg}`);
    logToFile('STEP', `${step}: ${msg}`);
  },
};

module.exports = logger;
