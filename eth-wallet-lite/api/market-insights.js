// This API endpoint returns example Ethereum market insights for the app.
export default function handler(req, res) {
  res.status(200).json({
    insights: [
      'ETH is showing strong support at $3,000.',
      'DeFi activity is up 15% this month.',
      'NFT market volume remains steady.'
    ]
  });
}
