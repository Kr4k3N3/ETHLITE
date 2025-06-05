// This file sets up example API endpoints for the app using Express (CommonJS version).
// It mocks AI chat, price data, prediction, and Etherscan proxy endpoints for testing.
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// DeepSeek API integration settings
const DEEPSEEK_API_KEY = 'sk-968f38acfb964e5da414991c39661572';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// This endpoint lets the app ask DeepSeek AI for ETH market answers
router.post('/ai-chat', express.json(), async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.json({ answer: 'Please ask a valid question about the ETH market.' });
  }
  try {
    // Try to fetch ETH price info from CoinGecko
    let ethPriceInfo = '';
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        const price = cgData.market_data.current_price.usd;
        const change = cgData.market_data.price_change_percentage_24h;
        const marketCap = cgData.market_data.market_cap.usd;
        ethPriceInfo = `Current Ethereum (ETH) price: $${price} (24h change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%, Market Cap: $${marketCap.toLocaleString()}) [CoinGecko, ${new Date().toLocaleDateString()}].`;
      }
    } catch (cgErr) {
      console.error('CoinGecko fetch error:', cgErr);
    }
    // Ask DeepSeek AI for an answer
    const deepseekRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: `You are an expert Ethereum market analyst. Always use up-to-date information. If the user asks about current events, use your best knowledge and cite your sources if possible.\n\nAt the end of every answer, always include a summary block in this exact format (with numbers):\n\n24h Prediction: $[number]\n7d Prediction: $[number]\nConfidence: [number]%\nMethod: DeepSeek AI` },
          ethPriceInfo ? { role: 'system', content: ethPriceInfo } : null,
          { role: 'user', content: question }
        ].filter(Boolean)
      })
    });
    if (!deepseekRes.ok) {
      const text = await deepseekRes.text();
      console.error('DeepSeek API error:', deepseekRes.status, text);
      return res.json({ answer: `DeepSeek API error: ${deepseekRes.status} ${text}` });
    }
    const deepseekData = await deepseekRes.json();
    const answer = deepseekData.choices?.[0]?.message?.content || 'No answer received from DeepSeek.';
    res.json({ answer });
  } catch (err) {
    console.error('DeepSeek fetch error:', err);
    res.json({ answer: 'Failed to get AI answer from DeepSeek.' });
  }
});

// This endpoint returns real or mock ETH price data
router.get('/price-data', async (req, res) => {
  try {
    const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7');
    if (!cgRes.ok) throw new Error('CoinGecko error');
    const cgData = await cgRes.json();
    res.json({
      prices: cgData.prices,
      currentPrice: cgData.prices[cgData.prices.length - 1][1]
    });
  } catch (err) {
    // fallback to mock data if CoinGecko fails
    const now = Date.now();
    const prices = Array.from({ length: 7 }, (_, i) => [now - (6 - i) * 86400000, 3000 + i * 20]);
    res.json({
      prices,
      currentPrice: 3120
    });
  }
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

// --- Etherscan Proxy Endpoint ---
router.get('/etherscan', async (req, res) => {
  const { network = 'mainnet', ...params } = req.query;
  const ETHERSCAN_API_KEY = 'AGVYCISVRPPSEJDKS59VVV6AW191RKAFNS';
  const ETHERSCAN_URLS = {
    mainnet: 'https://api.etherscan.io/api',
    sepolia: 'https://api-sepolia.etherscan.io/api',
  };
  const baseUrl = ETHERSCAN_URLS[network] || ETHERSCAN_URLS.mainnet;
  const urlParams = new URLSearchParams({ ...params, apikey: ETHERSCAN_API_KEY }).toString();
  const url = `${baseUrl}?${urlParams}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: '0', message: 'Proxy fetch failed', error: err.message });
  }
});

// --- Ethereum JSON-RPC Proxy Endpoint ---
router.post('/ethrpc', async (req, res) => {
  const { network = 'mainnet' } = req.query;
  const RPC_URLS = {
    mainnet: 'https://rpc.ankr.com/eth',
    sepolia: 'https://sepolia.infura.io/v3/45aaa878365644ca80666e00ac968f62',
  };
  const url = RPC_URLS[network] || RPC_URLS.mainnet;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy JSON-RPC fetch failed', message: err.message });
  }
});

// --- News Proxy Endpoint ---
router.get('/news', async (req, res) => {
  try {
    const newsRes = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=demo&currencies=ETH&public=true');
    const newsData = await newsRes.json();
    if (newsData.results && newsData.results.length > 0) {
      res.json({ news: newsData.results.map((n) => n.title) });
    } else {
      res.json({ news: [] });
    }
  } catch (err) {
    res.json({ news: [] });
  }
});

module.exports = router;
