// This file sets up example API endpoints for the app using Express.
// It mocks AI chat, price data, and prediction endpoints for testing.
const express = require('express');
const router = express.Router();

// This endpoint returns a mock answer from the AI chat
router.post('/ai-chat', (req, res) => {
  res.json({
    answer: '- Ethereum is up 2% this week.\n- Layer 2 adoption is growing.\n- SEC delays ETF decision.'
  });
});

// This endpoint returns example ETH price data
router.get('/price-data', (req, res) => {
  const now = Date.now();
  const prices = Array.from({ length: 7 }, (_, i) => [now - (6 - i) * 86400000, 3000 + i * 20]);
  res.json({
    prices,
    currentPrice: 3120
  });
});

// This endpoint returns a mock AI price prediction
router.get('/prediction', (req, res) => {
  res.json({
    predictedPrice24h: 3140.25,
    predictedPrice7d: 3205.50,
    confidenceScore: 0.82,
    method: 'Mock AI Model v1.0'
  });
});

module.exports = router;
