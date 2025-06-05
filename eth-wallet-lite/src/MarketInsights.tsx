// It fetches real ETH price data and lets users see AI-predicted prices for the next days.
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FaChartLine, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import MarketInsightsChat from './MarketInsightsChat.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MarketInsights = () => {
  // These keep track of price data, predictions, and loading/error states
  const [priceData, setPriceData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // When the component loads, fetch ETH price data from CoinGecko
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7');
        const data = await res.json();
        setPriceData(data);
        setCurrentPrice(data.prices[data.prices.length - 1][1]);
        setPriceChange(
          ((data.prices[data.prices.length - 1][1] - data.prices[0][1]) / data.prices[0][1]) * 100
        );
      } catch (e) {
        setError('Failed to fetch ETH price data.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // This updates the predictions when the AI chat gives new ones
  function handlePredictionUpdate(newPredictions: any) {
    setPredictions(newPredictions);
  }

  // This builds the chart data for the price and predictions
  const chartData = priceData && priceData.prices ? (() => {
    const realLabels = priceData.prices.map((p: any) => new Date(p[0]).toLocaleDateString());
    const realData = priceData.prices.map((p: any) => p[1]);
    let labels = [...realLabels];
    let predictionLine: (number|null)[] = [];
    if (predictions && priceData.prices.length > 1) {
      // Extend labels for 7 days ahead
      const lastDate = new Date(priceData.prices[priceData.prices.length - 1][0]);
      for (let i = 1; i <= 7; i++) {
        const next = new Date(lastDate);
        next.setDate(next.getDate() + i);
        labels.push(next.toLocaleDateString());
      }
      // Interpolate prediction line: last real price, 24h, then smooth to 7d
      const lastReal = realData[realData.length - 1];
      const pred24h = predictions.predictedPrice24h;
      const pred7d = predictions.predictedPrice7d;
      // Build prediction points: last real, 24h, then interpolate to 7d
      predictionLine = [
        ...Array(realData.length - 1).fill(null),
        lastReal,
        pred24h,
      ];
      // Interpolate between 24h and 7d for days 2-7
      for (let i = 1; i <= 6; i++) {
        const interp = pred24h + ((pred7d - pred24h) * (i / 6));
        predictionLine.push(interp);
      }
    }
    return {
      labels,
      datasets: [
        {
          label: 'ETH Price (USD)',
          data: [...realData, ...Array(predictions && priceData.prices.length > 1 ? 7 : 0).fill(null)],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.1,
          fill: true,
        },
        ...(predictions && priceData.prices.length > 1 ? [{
          label: 'AI Predicted Price',
          data: predictionLine,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
          pointRadius: 5
        }] : [])
      ]
    };
  })() : undefined;

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading market insights...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;

  return (
    <div className="main-app-container">
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 28, fontWeight: 700, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', marginBottom: 24 }}>
        <span style={{ color: '#fff', fontSize: 32 }}><FaChartLine /></span> Market Insights AI
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div className="card" style={{ background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', borderRadius: 12, padding: 20, minWidth: 180, flex: 1, boxShadow: '0 2px 8px #6366f122' }}>
          <div style={{ fontSize: 15 }}>Current ETH Price</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', borderRadius: 12, padding: 20, minWidth: 180, flex: 1, boxShadow: '0 2px 8px #10b98122' }}>
          <div style={{ fontSize: 15 }}>7d Change</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{priceChange ? priceChange.toFixed(2) : '--'}%</div>
        </div>
      </div>
      <MarketInsightsChat onPredictionUpdate={handlePredictionUpdate} />
      {predictions && (
        <div className="market-insights-predictions" style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>AI Predictions</h2>
          <div className="prediction-cards" style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            <div className="prediction-card card" style={{ background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', minWidth: 200, minHeight: 140, textAlign: 'center', margin: '0 12px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>24h Prediction</h3>
              <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>${predictions.predictedPrice24h?.toFixed(2)}</p>
            </div>
            <div className="prediction-card card" style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', minWidth: 200, minHeight: 140, textAlign: 'center', margin: '0 12px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>7d Prediction</h3>
              <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>${predictions.predictedPrice7d?.toFixed(2)}</p>
            </div>
            <div className="prediction-card card" style={{ background: 'linear-gradient(90deg,#ede9fe,#a5b4fc)', color: '#3730a3', minWidth: 200, minHeight: 140, textAlign: 'center', margin: '0 12px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Confidence</h3>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#10b981', margin: 0 }}>{Math.round(predictions.confidenceScore * 100)}%</p>
              <div style={{ fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' }}>{predictions.method && `Method: ${predictions.method}`}</div>
            </div>
          </div>
        </div>
      )}
      <div className="card market-insights-chart" style={{ background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', borderRadius: 16, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px #6366f122' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Market Trends</h2>
        {chartData ? <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} /> : <p>Loading market data...</p>}
      </div>
      <div
        className="market-insights-feedback card"
        style={{
          textAlign: 'center',
          marginTop: 24,
          background:
            feedback === 'up'
              ? 'linear-gradient(90deg,#bbf7d0,#6ee7b7)'
              : feedback === 'down'
              ? 'linear-gradient(90deg,#fee2e2,#fca5a5)'
              : '#f1f5f9',
          color: '#3730a3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s',
        }}
      >
        <h3 style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Was this insight helpful?</h3>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            className="feedback-btn"
            style={{
              background: '#e0f2fe',
              border: 'none',
              borderRadius: 6,
              padding: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: feedback === 'up' ? '0 0 0 2px #10b98155' : undefined,
              outline: feedback === 'up' ? '2px solid #10b981' : undefined,
              transition: 'box-shadow 0.2s, outline 0.2s',
            }}
            aria-label="Thumbs up"
            type="button"
            onClick={() => setFeedback('up')}
          >
            <FaThumbsUp color="#10b981" size={18} />
          </button>
          <button
            className="feedback-btn"
            style={{
              background: '#fee2e2',
              border: 'none',
              borderRadius: 6,
              padding: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: feedback === 'down' ? '0 0 0 2px #ef444455' : undefined,
              outline: feedback === 'down' ? '2px solid #ef4444' : undefined,
              transition: 'box-shadow 0.2s, outline 0.2s',
            }}
            aria-label="Thumbs down"
            type="button"
            onClick={() => setFeedback('down')}
          >
            <FaThumbsDown color="#ef4444" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
