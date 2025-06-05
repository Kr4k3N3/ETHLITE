// This file lets users ask questions to an AI about the ETH market.
// It shows a chat box where you can type a question and get an answer, including price predictions.
import React, { useState } from 'react';

const MarketInsightsChat: React.FC<{ onPredictionUpdate?: (pred: any) => void }> = ({ onPredictionUpdate }) => {
  // These keep track of the user's question, the AI's answer, and loading state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // This tries to pull out price predictions from the AI's answer
  function extractPredictions(answer: string) {
    // Even more robust: match both markdown, colons, and allow for whitespace/newlines
    const pred24h = /24h Prediction[\s:]*\**:?\**\s*\$?([\d,.]+)/i.exec(answer)?.[1];
    const pred7d = /7d Prediction[\s:]*\**:?\**\s*\$?([\d,.]+)/i.exec(answer)?.[1];
    const confidence = /Confidence[\s:]*\**:?\**\s*([\d]+)%/i.exec(answer)?.[1];
    const method = /Method[\s:]*\**:?\**\s*([\w .\-()]+)/i.exec(answer)?.[1];
    if (pred24h && pred7d && confidence) {
      return {
        predictedPrice24h: parseFloat(pred24h.replace(/,/g, '')),
        predictedPrice7d: parseFloat(pred7d.replace(/,/g, '')),
        confidenceScore: parseFloat(confidence) / 100,
        method: method || 'AI Model'
      };
    }
    return null;
  }

  // This function runs when the user submits a question to the AI
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch('/api/market/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }
      const data = await res.json();
      setAnswer(data.answer || 'No answer received.');
      if (onPredictionUpdate) {
        const pred = extractPredictions(data.answer || '');
        if (pred) onPredictionUpdate(pred);
      }
    } catch (err) {
      setAnswer('Failed to get AI answer. ' + (err instanceof Error ? err.message : ''));
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 32, background: 'linear-gradient(90deg,#ede9fe,#a5b4fc)', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px #6366f144', border: '2px solid #6366f1', maxWidth: '100%', marginLeft: 0, marginRight: 0 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#3730a3', letterSpacing: 0.5, textShadow: '0 1px 8px #fff8' }}>Ask Market Insights AI</h3>
      <form onSubmit={handleAsk} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Ask a question about ETH market..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #a5b4fc', background: '#fff', fontSize: 15, color: '#3730a3' }}
          required
        />
        <button type="submit" style={{ background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #6366f122' }} disabled={loading}>{loading ? 'Asking...' : 'Ask'}</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => setQuestion('What is your ETH price prediction?')} style={{ background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 4px #6366f111' }}>Prediction</button>
        <button type="button" onClick={() => setQuestion('What are the current ETH market risks?')} style={{ background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 4px #6366f111' }}>Risks</button>
        <button type="button" onClick={() => setQuestion('What are the top ETH opportunities this week?')} style={{ background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 4px #6366f111' }}>Opportunities</button>
      </div>
      {answer && <div style={{ marginTop: 10, color: '#3730a3', fontSize: 15, background: '#f1f5f9', borderRadius: 8, padding: 10, boxShadow: '0 1px 4px #6366f111' }}>{answer}</div>}
    </div>
  );
};

export default MarketInsightsChat;
