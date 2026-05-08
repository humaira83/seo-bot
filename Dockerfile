FROM node:20-slim

# ব্রাউজার চালানোর জন্য সিস্টেম লাইব্রেরি ইনস্টল
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

# প্লে-রাইট ব্রাউজার ইনস্টল
RUN npx playwright install chromium

COPY . .

CMD ["node", "src/index.js"]
