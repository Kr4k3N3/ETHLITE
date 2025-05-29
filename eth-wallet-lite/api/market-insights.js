// Vercel API route: /api/market-insights
export default function handler(req, res) {
  // Example: Return static insights. Replace with real data as needed.
  res.status(200).json({
    insights: [
      'ETH is showing strong support at $3,000.',
      'DeFi activity is up 15% this month.',
      'NFT market volume remains steady.'
    ]
  });
}
