// This API endpoint lets the app ask an AI for Ethereum market predictions and answers.
// It uses DeepSeek AI and CoinGecko to get up-to-date ETH price info and generate a response.
export default async function handler(req, res) {
  // Get the DeepSeek API key from environment variables
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({ error: 'Server misconfiguration: missing DEEPSEEK_API_KEY' });
    return;
  }
  // Parse the request body (handle both string and object)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }
  // Get the user's question or prompt
  const { prompt, question } = body || {};
  const userPrompt = prompt || question;
  if (!userPrompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }
  // Try to fetch the latest ETH price info from CoinGecko
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
    // If CoinGecko fails, just skip price info
  }

  try {
    // Ask DeepSeek AI for an answer, including the latest ETH price info
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `You are an expert Ethereum market analyst. Always use up-to-date information. If the user asks about current events, use your best knowledge and cite your sources if possible.\n\nHere is the latest ETH price data: ${ethPriceInfo}\n\nAt the end of every answer, you MUST include a summary block in this exact format (with numbers, not placeholders):\n\n24h Prediction: $[number]\n7d Prediction: $[number]\nConfidence: [number]%\nMethod: DeepSeek AI\n\nIf you cannot provide a prediction, you must still output the summary block with your best estimate. Do not skip the summary block under any circumstances.` },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!deepseekRes.ok) {
      const text = await deepseekRes.text();
      res.status(200).json({ answer: `DeepSeek API error: ${deepseekRes.status} ${text}` });
      return;
    }
    const deepseekData = await deepseekRes.json();
    const answer = deepseekData.choices?.[0]?.message?.content || 'No answer received from DeepSeek.';
    res.status(200).json({ answer });
  } catch (err) {
    res.status(200).json({ answer: 'Failed to get AI answer from DeepSeek.' });
  }
}
