// Simple Express API mock for /api/market/ai-chat and /api/market/price-data
const express = require('express');
const router = express.Router();

// Mock AI chat endpoint
router.post('/ai-chat', (req, res) => {
  res.json({
    answer: '- Ethereum is up 2% this week.\n- Layer 2 adoption is growing.\n- SEC delays ETF decision.'
  });
});

// Mock price data endpoint
router.get('/price-data', (req, res) => {
  const now = Date.now();
  const prices = Array.from({ length: 7 }, (_, i) => [now - (6 - i) * 86400000, 3000 + i * 20]);
  res.json({
    prices,
    currentPrice: 3120
  });
});

// Mock prediction endpoint
router.get('/prediction', (req, res) => {
  res.json({
    predictedPrice24h: 3140.25,
    predictedPrice7d: 3205.50,
    confidenceScore: 0.82,
    method: 'Mock AI Model v1.0'
  });
});

module.exports = router;
