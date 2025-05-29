// Vercel API route: /api/market/ai-chat
export default async function handler(req, res) {
  console.log('AI-CHAT: Incoming request', { method: req.method, body: req.body });
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      console.error('AI-CHAT: Invalid JSON body');
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const { prompt, question } = body || {};
  const userPrompt = prompt || question;
  if (!userPrompt) {
    console.error('AI-CHAT: Missing prompt or question');
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  // --- DeepSeek AI integration ---
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
  if (!DEEPSEEK_API_KEY) {
    console.error('AI-CHAT: Missing DEEPSEEK_API_KEY environment variable');
    res.status(500).json({ error: 'Server misconfiguration: missing DEEPSEEK_API_KEY' });
    return;
  }
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const DEEPSEEK_MODEL = 'deepseek-chat';

  // Fetch ETH price, 24h change, and market cap from CoinGecko
  let ethPriceInfo = '';
  try {
    const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
    if (cgRes.ok) {
      const cgData = await cgRes.json();
      const price = cgData.market_data.current_price.usd;
      const change = cgData.market_data.price_change_percentage_24h;
      const marketCap = cgData.market_data.market_cap.usd;
      ethPriceInfo = `Current Ethereum (ETH) price: $${price} (24h change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%, Market Cap: $${marketCap.toLocaleString()}) [CoinGecko, ${new Date().toLocaleDateString()}].`;
    } else {
      const text = await cgRes.text();
      console.error('AI-CHAT: CoinGecko fetch failed', cgRes.status, text);
    }
  } catch (cgErr) {
    console.error('AI-CHAT: CoinGecko fetch error', cgErr);
  }

  try {
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
          { role: 'user', content: userPrompt }
        ].filter(Boolean)
      })
    });
    if (!deepseekRes.ok) {
      const text = await deepseekRes.text();
      console.error('AI-CHAT: DeepSeek API error', deepseekRes.status, text);
      res.status(200).json({ answer: `DeepSeek API error: ${deepseekRes.status} ${text}` });
      return;
    }
    const deepseekData = await deepseekRes.json();
    const answer = deepseekData.choices?.[0]?.message?.content || 'No answer received from DeepSeek.';
    res.status(200).json({ answer });
  } catch (err) {
    console.error('AI-CHAT: DeepSeek fetch error', err);
    res.status(200).json({ answer: 'Failed to get AI answer from DeepSeek.' });
  }
}
