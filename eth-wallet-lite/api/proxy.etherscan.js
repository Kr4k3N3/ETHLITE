// Vercel API route: /api/proxy/etherscan
export default async function handler(req, res) {
  const { network, module, action, address, sort } = req.query;
  // Basic validation
  if (!network || !module || !action || !address) {
    res.status(400).json({ error: 'Missing required query parameters.' });
    return;
  }
  // Example: Use Etherscan public API (replace with your API key if needed)
  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  const baseUrl = network === 'mainnet'
    ? 'https://api.etherscan.io/api'
    : network === 'sepolia'
      ? 'https://api-sepolia.etherscan.io/api'
      : null;
  if (!baseUrl) {
    res.status(400).json({ error: 'Unsupported network.' });
    return;
  }
  const url = `${baseUrl}?module=${module}&action=${action}&address=${address}&sort=${sort || 'desc'}&apikey=${apiKey}`;
  try {
    const fetchRes = await fetch(url);
    const data = await fetchRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Etherscan', details: err.message });
  }
}
