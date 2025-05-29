// Vercel API route: /api/market/ai-chat
// Helper to add timeout to fetch
async function fetchWithTimeout(resource, options = {}, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  // If body is a string, parse it as JSON
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const { prompt, question } = body || {};
  const userPrompt = prompt || question;
  if (!userPrompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  // --- DeepSeek AI integration ---
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const DEEPSEEK_MODEL = 'deepseek-chat';

  // Fetch ETH price, 24h change, and market cap from CoinGecko
  let ethPriceInfo = '';
  try {
    const cgRes = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false', {}, 5000);
    if (cgRes.ok) {
      const cgData = await cgRes.json();
      const price = cgData.market_data.current_price.usd;
      const change = cgData.market_data.price_change_percentage_24h;
      const marketCap = cgData.market_data.market_cap.usd;
      ethPriceInfo = `Current Ethereum (ETH) price: $${price} (24h change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%, Market Cap: $${marketCap.toLocaleString()}) [CoinGecko, ${new Date().toLocaleDateString()}].`;
    }
  } catch (cgErr) {
    // Ignore CoinGecko error, fallback to no price info
  }

  try {
    const deepseekRes = await fetchWithTimeout(DEEPSEEK_API_URL, {
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
          { role: 'user', content: userPrompt }
        ].filter(Boolean)
      })
    }, 7000);
    if (!deepseekRes.ok) {
      const text = await deepseekRes.text();
      res.status(200).json({ answer: `DeepSeek API error: ${deepseekRes.status} ${text}` });
      return;
    }
    const deepseekData = await deepseekRes.json();
    const answer = deepseekData.choices?.[0]?.message?.content || 'No answer received from DeepSeek.';
    res.status(200).json({ answer });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(200).json({ answer: 'AI service timed out. Please try again later.' });
    } else {
      res.status(200).json({ answer: 'Failed to get AI answer from DeepSeek.' });
    }
  }
}
