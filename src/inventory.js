const fs = require('fs');
const path = require('path');
const inventoryPath = path.join(__dirname, 'inventory.json');

// ইনভেন্টরি লোড করা
const loadInventory = () => {
    if (!fs.existsSync(inventoryPath)) return { keywords: [], posted_urls: [] };
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
};

// ইনভেন্টরি সেভ করা
const saveInventory = (data) => fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2));

const InventoryManager = {
    // ২০টি কি-ওয়ার্ড একসাথে অ্যাড করা (ডুপ্লিকেট চেক করে)
    addKeywords: (newKeywords) => {
        let data = loadInventory();
        let addedCount = 0;
        newKeywords.forEach(k => {
            if (!data.keywords.find(item => item.q === k.q)) {
                data.keywords.push({ ...k, status: 'pending', questions: [] });
                addedCount++;
            }
        });
        saveInventory(data);
        return addedCount;
    },

    // পরবর্তী পেন্ডিং কি-ওয়ার্ডটি নেওয়া
    getNextKeyword: () => {
        let data = loadInventory();
        return data.keywords.find(k => k.status === 'pending');
    },

    // কাজ শেষ হলে স্ট্যাটাস আপডেট করা
    markAsComplete: (keyword) => {
        let data = loadInventory();
        let item = data.keywords.find(k => k.q === keyword);
        if (item) item.status = 'completed';
        saveInventory(data);
    }
};

module.exports = InventoryManager;
