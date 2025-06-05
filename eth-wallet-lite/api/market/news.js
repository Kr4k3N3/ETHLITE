// This API endpoint returns example Ethereum news headlines for the app.
export default function handler(req, res) {
  res.status(200).json({
    news: [
      'Ethereum 2.0 upgrades continue to roll out.',
      'SEC delays decision on ETH ETF.',
      'Layer 2 adoption is growing rapidly.',
      'Major DeFi protocols announce new integrations.'
    ]
  });
}
