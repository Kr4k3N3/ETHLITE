import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.js'
import Dashboard from './Dashboard.js'
import MarketInsights from './MarketInsights.js'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { FaMoon, FaSun } from 'react-icons/fa';

const Root = () => {
  // Start with dark mode enabled
  const [darkMode, setDarkMode] = useState(true);
  const [wallet, setWallet] = useState<any>(null);

  // Ensure dark mode is applied on initial render
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Toggle dark mode by adding/removing 'dark' class on body
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      return next;
    });
  };

  // Add a floating toggle in the top-left corner
  const DarkModeSwitch = (
    <button
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'fixed',
        top: 18,
        left: 18,
        zIndex: 100,
        width: 44,
        height: 28,
        border: 'none',
        borderRadius: 16,
        background: darkMode ? '#23272f' : '#f4f7fa',
        boxShadow: '0 2px 8px #0002',
        display: 'flex',
        alignItems: 'center',
        justifyContent: darkMode ? 'flex-end' : 'flex-start',
        padding: 3,
        transition: 'background 0.2s',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: darkMode ? '#6366f1' : '#fbbf24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 15,
        boxShadow: '0 1px 4px #0002',
        transition: 'background 0.2s',
      }}>
        {darkMode ? <FaMoon /> : <FaSun />}
      </span>
    </button>
  );

  // Only show navbar and routes if wallet is imported
  const isWalletLoaded = wallet && ((wallet.wallet && wallet.network) || wallet.address)
  const Navbar = isWalletLoaded ? (
    <nav
      className={`navbar${darkMode ? ' dark' : ''}`}
      style={{
        background: 'linear-gradient(90deg,#6366f1,#60a5fa)',
        color: '#fff',
        borderRadius: 16,
        margin: '32px auto',
        boxShadow: '0 2px 8px #6366f122',
        padding: '14px 32px',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        maxWidth: 900,
        justifyContent: 'space-between', // changed from center
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, opacity: 0.97 }}>Wallet</Link>
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, opacity: 0.97 }}>Dashboard</Link>
        <Link to="/market-insights" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, opacity: 0.97 }}>Market Insights</Link>
      </div>
      <button
        onClick={() => setWallet(null)}
        style={{
          background: 'linear-gradient(90deg,#f43f5e,#f59e42)',
          color: '#fff',
          border: 'none',
          borderRadius: 24,
          fontWeight: 700,
          fontSize: 16,
          padding: '0.5rem 1.8rem',
          boxShadow: '0 2px 8px #f59e4222',
          letterSpacing: 1,
          cursor: 'pointer',
          transition: 'background 0.2s',
          outline: 'none',
          // Remove position/absolute/top/right/transform
        }}
        className="logout-btn"
        aria-label="Log Out"
      >
        Log Out
      </button>
    </nav>
  ) : null

  // Normalize wallet for App: if legacy (ethers.Wallet), wrap as {wallet, network: 'mainnet'}
  const normalizedWallet = wallet && wallet.wallet && wallet.network
    ? wallet
    : wallet && wallet.address
      ? { wallet, network: 'mainnet' }
      : null

  // Helper to extract address from wallet (handles both {wallet: {address}} and {address})
  const getWalletAddress = (w: any) => {
    if (!w) return null;
    if (w.wallet && w.wallet.address) return w.wallet.address;
    if (w.address) return w.address;
    return null;
  };

  // Use ethers directly instead of require()
  const getProviderForNetwork = (network: string) => {
    switch (network) {
      case 'sepolia':
        return new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/45aaa878365644ca80666e00ac968f62')
      case 'goerli':
        return new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_goerli')
      case 'mainnet':
      default:
        // Use Ankr for mainnet for browser compatibility
        return new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
    }
  }

  return (
    <>
      {DarkModeSwitch}
      <Router>
        {Navbar}
        <Routes>
          <Route path="/" element={<App setWallet={setWallet} wallet={normalizedWallet} />} />
          <Route path="/dashboard" element={
            isWalletLoaded ? (
              <Dashboard
                provider={normalizedWallet ? getProviderForNetwork(normalizedWallet.network) as ethers.JsonRpcProvider : null}
                address={getWalletAddress(normalizedWallet)}
              />
            ) : <Navigate to="/" />
          } />
          <Route path="/market-insights" element={isWalletLoaded ? <MarketInsights /> : <Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
