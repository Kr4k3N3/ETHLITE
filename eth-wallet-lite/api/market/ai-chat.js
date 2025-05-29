// Vercel API route: /api/market/ai-chat
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

  // Example mock answer with predictions, risks, and opportunities
  res.status(200).json({
    answer: `**Prediction:**\n24h Prediction: $3,200\n7d Prediction: $3,350\nConfidence: 78%\nMethod: Mock AI Model v1.0\n\n**Risks:**\n- Market volatility due to macroeconomic news\n- Potential regulatory announcements\n\n**Opportunities:**\n- Layer 2 adoption growth\n- Upcoming Ethereum upgrades`
  });
}
