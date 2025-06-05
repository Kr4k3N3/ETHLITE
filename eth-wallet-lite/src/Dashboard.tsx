// This file creates the main dashboard page for the wallet app.
// It shows your wallet balance, recent transactions, ETH price chart, and news.
// The design uses cards and icons to make things easy to see and understand.

import React, { useEffect, useState } from 'react';
import { FaWallet, FaExchangeAlt, FaChartLine, FaInfoCircle, FaNewspaper } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ethers } from 'ethers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// This is a small card that shows a summary (like balance or activity)
const SummaryCard = ({ icon: Icon, title, value, style }: { icon: any, title: string, value: string | number, style?: React.CSSProperties }) => (
  <div className="card dashboard-summary-card" style={style}>
    <Icon className="dashboard-icon" />
    <div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

interface DashboardProps {
  provider: ethers.JsonRpcProvider | null;
  address: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ provider, address }) => {
  // These are pieces of information we want to keep track of on the dashboard
  const [balance, setBalance] = useState('0'); // ETH balance
  const [marketData, setMarketData] = useState<any>(null); // ETH price and chart
  const [news, setNews] = useState<string[]>([]); // Crypto news
  const [loading, setLoading] = useState(true); // Loading state
  const [recentTx, setRecentTx] = useState<any[]>([]); // Recent transactions
  const [network, setNetwork] = useState<string>('mainnet'); // Which network we're on
  const [recentActivityCount, setRecentActivityCount] = useState(0); // Number of recent activities
  const [etherscanDebug, setEtherscanDebug] = useState<any>(null); // For debugging API calls
  const [notFound, setNotFound] = useState(false); // If address not found
  const [error, setError] = useState<string | null>(null); // Error messages

  // These store extra debug info for mainnet and sepolia networks
  const [mainnetDebug, setMainnetDebug] = useState<any>(null);
  const [sepoliaDebug, setSepoliaDebug] = useState<any>(null);

  // This function tries to fetch data from the internet, and if it fails, it tries again a few times
  async function fetchWithRetry(url: string, opts: any = {}, maxRetries = 3, baseDelay = 1000) {
    let attempt = 0;
    let lastErr: any = null;
    while (attempt < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), opts.timeout || 4000);
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        // If we hit a rate limit, try again
        if (data && data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('rate limit')) {
          throw new Error('rate limit');
        }
        return data;
      } catch (err: any) {
        lastErr = err;
        // Only try again if it's a network error, timeout, or rate limit
        if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('rate limit')) || err.message === 'timeout') {
          await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
          attempt++;
        } else {
          break;
        }
      }
    }
    throw lastErr || new Error('fetchWithRetry failed');
  }

  // This function gets transactions and balance for a specific network (mainnet or sepolia)
  const fetchNetworkData = async (net: string) => {
    const txUrl = `/api/proxy/etherscan?network=${net}&module=account&action=txlist&address=${address}&sort=desc`;
    let txData;
    try {
      txData = await fetchWithRetry(txUrl, { timeout: 4000 });
    } catch (err) {
      return { txData: { status: '0', message: 'Fetch error', result: [] }, bal: '0' };
    }
    // Try to get the balance using the provider, if not, use etherscan
    let bal = '0';
    if (provider && address) {
      try {
        const provNet = await provider.getNetwork();
        if ((provNet.name === net) || (provNet.chainId === 1n && net === 'mainnet') || (provNet.chainId === 11155111n && net === 'sepolia')) {
          bal = ethers.formatEther(await provider.getBalance(address));
        } else {
          throw new Error('Provider network mismatch');
        }
      } catch {
        // If provider fails, try etherscan
        try {
          const balUrl = `/api/proxy/etherscan?network=${net}&module=account&action=balance&address=${address}`;
          const balRes = await fetchWithRetry(balUrl, { timeout: 4000 });
          if (balRes.status === '1') {
            bal = ethers.formatEther(balRes.result);
          }
        } catch {
          bal = '0';
        }
      }
    }
    return { txData, bal };
  };

  useEffect(() => {
    let cancelled = false;
    const detectNetwork = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setRecentTx([]);
      setRecentActivityCount(0);
      setEtherscanDebug(null);
      setMainnetDebug(null);
      setSepoliaDebug(null);
      try {
        // Fetch both networks in parallel for speed
        const [mainnet, sepolia] = await Promise.all([
          fetchNetworkData('mainnet'),
          fetchNetworkData('sepolia')
        ]);
        setMainnetDebug(mainnet.txData);
        setSepoliaDebug(sepolia.txData);
        // Detect rate limit
        const mainnetRateLimited = mainnet.txData && mainnet.txData.message && mainnet.txData.message.toLowerCase().includes('rate limit');
        const sepoliaRateLimited = sepolia.txData && sepolia.txData.message && sepolia.txData.message.toLowerCase().includes('rate limit');
        if (mainnetRateLimited || sepoliaRateLimited) {
          setError('Etherscan API rate limit reached. Please wait a few seconds and refresh.');
          setNetwork('mainnet');
          setRecentTx([]);
          setRecentActivityCount(0);
          setBalance('0');
          setEtherscanDebug(mainnetRateLimited ? mainnet.txData : sepolia.txData);
          setNotFound(false);
        } else if (!cancelled && mainnet.txData.status === '1' && Array.isArray(mainnet.txData.result) && mainnet.txData.result.length > 0) {
          setNetwork('mainnet');
          setRecentTx(mainnet.txData.result.slice(0, 10));
          setRecentActivityCount(mainnet.txData.result.length);
          setBalance(mainnet.bal);
          setEtherscanDebug(mainnet.txData);
          setNotFound(false);
          setError(null);
        } else if (!cancelled && sepolia.txData.status === '1' && Array.isArray(sepolia.txData.result) && sepolia.txData.result.length > 0) {
          setNetwork('sepolia');
          setRecentTx(sepolia.txData.result.slice(0, 10));
          setRecentActivityCount(sepolia.txData.result.length);
          setBalance(sepolia.bal);
          setEtherscanDebug(sepolia.txData);
          setNotFound(false);
          setError(null);
        } else {
          setNetwork('mainnet');
          setRecentTx([]);
          setRecentActivityCount(0);
          setBalance('0');
          setEtherscanDebug(mainnet.txData || sepolia.txData || { status: '0', message: 'No response', result: [] });
          setNotFound(true);
          setError('Address not found on mainnet or Sepolia.');
        }
      } catch (err) {
        setNetwork('mainnet');
        setRecentTx([]);
        setRecentActivityCount(0);
        setBalance('0');
        setEtherscanDebug({ status: '0', message: 'Error or timeout', result: [] });
        setNotFound(true);
        setError('Failed to load dashboard data. See console for details.');
      } finally {
        setLoading(false);
      }
    };
    if (address && provider) {
      detectNetwork();
    } else {
      setRecentTx([]);
      setRecentActivityCount(0);
      setBalance('0');
      setEtherscanDebug({ status: '0', message: 'No address or provider', result: [] });
      setMainnetDebug(null);
      setSepoliaDebug(null);
      setLoading(false);
    }
    // Market data and news (unchanged)
    fetch('/api/market/price-data')
      .then(res => res.json())
      .then(data => setMarketData({ prices: data.prices, currentPrice: data.currentPrice }))
      .catch(() => setMarketData(null));
    fetch('/api/market/news')
      .then(res => res.json())
      .then(data => {
        if (data.news && data.news.length > 0) {
          setNews(data.news);
        } else {
          setNews([
            'Ethereum 2.0 upgrades continue to roll out.',
            'SEC delays decision on ETH ETF.',
            'Layer 2 adoption is growing rapidly.',
            'Major DeFi protocols announce new integrations.'
          ]);
        }
      })
      .catch(() => setNews([
        'Ethereum 2.0 upgrades continue to roll out.',
        'SEC delays decision on ETH ETF.',
        'Layer 2 adoption is growing rapidly.',
        'Major DeFi protocols announce new integrations.'
      ]));
    return () => { cancelled = true; };
  }, [provider, address]); // network removed from dependencies

  // Add a loading timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: any = null;
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Dashboard loading timed out. Please check your network or try again.');
      }, 7000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [loading]);

  const chartData = marketData && marketData.prices ? {
    labels: marketData.prices.slice(-7).map((price: any) => new Date(price[0]).toLocaleDateString()),
    datasets: [
      {
        label: 'ETH Price (USD)',
        data: marketData.prices.slice(-7).map((price: any) => price[1]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  } : undefined;

  // Portfolio value (ETH only for now)
  const portfolioValue = marketData && marketData.currentPrice ? (parseFloat(balance) * marketData.currentPrice).toFixed(2) : '0.00';

  // Always show debug output, even while loading
  const debugBlock = (
    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 8, margin: '16px 0', fontSize: 13 }}>
      <b>Debug:</b> provider: {provider ? 'OK' : 'null'} | address: {address || 'null'}<br />
      <b>Network used:</b> {network}<br />
      <b>Mainnet Etherscan response:</b> <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',fontSize:11,maxHeight:120,overflow:'auto'}}>{mainnetDebug ? JSON.stringify(mainnetDebug, null, 2) : 'No response yet'}</pre>
      <b>Sepolia Etherscan response:</b> <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',fontSize:11,maxHeight:120,overflow:'auto'}}>{sepoliaDebug ? JSON.stringify(sepoliaDebug, null, 2) : 'No response yet'}</pre>
      <b>Displayed Etherscan response:</b> <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',fontSize:11,maxHeight:120,overflow:'auto'}}>{etherscanDebug ? JSON.stringify(etherscanDebug, null, 2) : 'No response yet'}</pre>
      {mainnetDebug && mainnetDebug.message && mainnetDebug.message.toLowerCase().includes('rate limit') && <div style={{color:'#b91c1c',marginTop:8}}>Mainnet: Etherscan rate limit or error.</div>}
      {sepoliaDebug && sepoliaDebug.message && sepoliaDebug.message.toLowerCase().includes('rate limit') && <div style={{color:'#b91c1c',marginTop:8}}>Sepolia: Etherscan rate limit or error.</div>}
      {notFound && <div style={{color:'#b91c1c',marginTop:8}}>Address not found on mainnet or Sepolia.</div>}
      {error && <div style={{color:'#b91c1c',marginTop:8}}>{error}</div>}
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>{debugBlock}Loading dashboard...</div>;

  if (!address || !provider) {
    return (
      <div style={{ textAlign: 'center', marginTop: 60, color: '#b91c1c', fontSize: 18, fontWeight: 600 }}>
        Please connect or import a wallet to view your dashboard.
      </div>
    );
  }

  // Network options
  const networks = [
    { name: 'mainnet', label: 'Ethereum Mainnet' },
    { name: 'goerli', label: 'Goerli Testnet' },
    { name: 'sepolia', label: 'Sepolia Testnet' },
  ];

  const cardStyles = [
    {
      background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', boxShadow: '0 2px 8px #6366f122'
    },
    {
      background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', boxShadow: '0 2px 8px #10b98122'
    },
    {
      background: 'linear-gradient(90deg,#f59e42,#fbbf24)', color: '#fff', boxShadow: '0 2px 8px #fbbf2422'
    },
    {
      background: 'linear-gradient(90deg,#ede9fe,#a5b4fc)', color: '#3730a3', boxShadow: '0 2px 8px #a5b4fc22'
    },
  ];

  return (
    <div className="main-app-container">
      <div className="card dashboard-header" style={{ background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff' }}>
        <span style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}><FaWallet size={32} /></span>
        Wallet Dashboard
      </div>
      <div className="dashboard-summary">
        <SummaryCard icon={FaWallet} title="Wallet Balance" value={`${balance ? parseFloat(balance).toFixed(4) : '0.0000'} ETH`} style={cardStyles[0]} />
        <SummaryCard icon={FaChartLine} title="Portfolio Value" value={`$${portfolioValue}`} style={cardStyles[1]} />
        <SummaryCard icon={FaExchangeAlt} title="Recent Activity" value={recentActivityCount} style={cardStyles[2]} />
        <SummaryCard icon={FaInfoCircle} title="Network" value={network} style={cardStyles[3]} />
      </div>
      <div className="dashboard-chart">
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Market Trends</h2>
        {chartData ? (
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
        ) : (
          <div>Loading chart...</div>
        )}
      </div>
      <div className="card" style={{ margin: '0 auto', maxWidth: 500, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <FaNewspaper size={20} />
          <span style={{ fontWeight: 600, fontSize: 18 }}>Recent News</span>
        </div>
        {news && news.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {news.slice(0, 4).map((n, i) => (
              <li key={i} style={{ marginBottom: 10, color: 'var(--card-text, #222)' }}>{n}</li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No news available.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
