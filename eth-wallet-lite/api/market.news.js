// Vercel API route: /api/market/news
export default function handler(req, res) {
  // Example: Return static news. Replace with real news fetching if needed.
  res.status(200).json({
    news: [
      'Ethereum 2.0 upgrades continue to roll out.',
      'SEC delays decision on ETH ETF.',
      'Layer 2 adoption is growing rapidly.',
      'Major DeFi protocols announce new integrations.'
    ]
  });
}
