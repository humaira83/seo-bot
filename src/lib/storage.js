/**
 * Simple JSON-based storage for tracking
 * - Used keywords (avoid duplicates)
 * - Generated articles
 * - Internal link map
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class Storage {
  constructor(filename) {
    this.file = path.join(DATA_DIR, filename);
    this.data = this.load();
  }
  
  load() {
    if (!fs.existsSync(this.file)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  
  save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }
  
  get(key) { return this.data[key]; }
  set(key, value) { this.data[key] = value; this.save(); }
  has(key) { return key in this.data; }
  delete(key) { delete this.data[key]; this.save(); }
  all() { return this.data; }
  keys() { return Object.keys(this.data); }
}

// Specialized stores
const keywordStore = new Storage('used-keywords.json');
const articleStore = new Storage('generated-articles.json');
const linkMap = new Storage('link-map.json');

module.exports = { Storage, keywordStore, articleStore, linkMap };
