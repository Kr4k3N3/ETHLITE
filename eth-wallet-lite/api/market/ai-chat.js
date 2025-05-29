// Vercel API route: /api/market/ai-chat
export default async function handler(req, res) {
  // TEST: Only call CoinGecko and return result
  try {
    const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
    if (cgRes.ok) {
      const cgData = await cgRes.json();
      const price = cgData.market_data.current_price.usd;
      const change = cgData.market_data.price_change_percentage_24h;
      const marketCap = cgData.market_data.market_cap.usd;
      res.status(200).json({ answer: `ETH price: $${price}, 24h change: ${change}%, Market Cap: $${marketCap}` });
      return;
    } else {
      const text = await cgRes.text();
      res.status(500).json({ error: `CoinGecko error: ${cgRes.status} ${text}` });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: 'CoinGecko fetch failed', details: err.message });
    return;
  }
}
