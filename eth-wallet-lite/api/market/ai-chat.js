// Vercel API route: /api/market/ai-chat
export default async function handler(req, res) {
  // TEST: Only call DeepSeek (no CoinGecko)
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({ error: 'Server misconfiguration: missing DEEPSEEK_API_KEY' });
    return;
  }
  let body = req.body;
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
  try {
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `You are an expert Ethereum market analyst. Always use up-to-date information. If the user asks about current events, use your best knowledge and cite your sources if possible.\n\nAt the end of every answer, you MUST include a summary block in this exact format (with numbers, not placeholders):\n\n24h Prediction: $[number]\n7d Prediction: $[number]\nConfidence: [number]%\nMethod: DeepSeek AI\n\nIf you cannot provide a prediction, you must still output the summary block with your best estimate. Do not skip the summary block under any circumstances.` },
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
