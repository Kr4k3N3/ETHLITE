// This API endpoint acts as a proxy to fetch data from Etherscan for the app.
// It takes network, module, action, and address as query parameters and returns the result from Etherscan.
export default async function handler(req, res) {
  const { network, module, action, address, sort } = req.query;
  if (!network || !module || !action || !address) {
    res.status(400).json({ error: 'Missing required query parameters.' });
    return;
  }
  // Get the Etherscan API key from environment variables
  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  // Choose the correct Etherscan API URL based on the network
  const baseUrl = network === 'mainnet'
    ? 'https://api.etherscan.io/api'
    : network === 'sepolia'
      ? 'https://api-sepolia.etherscan.io/api'
      : null;
  if (!baseUrl) {
    res.status(400).json({ error: 'Unsupported network.' });
    return;
  }
  // Build the full URL for the Etherscan API request
  const url = `${baseUrl}?module=${module}&action=${action}&address=${address}&sort=${sort || 'desc'}&apikey=${apiKey}`;
  try {
    // Fetch data from Etherscan and return it
    const fetchRes = await fetch(url);
    const data = await fetchRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Etherscan', details: err.message });
  }
}
