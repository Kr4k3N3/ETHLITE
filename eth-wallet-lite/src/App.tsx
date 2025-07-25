// App.tsx - Main React component for the Ethereum Wallet Lite app
// This file is the heart of the app. It manages wallet, lets you send/receive ETH, and shows your dashboard.
import { Analytics } from "@vercel/analytics/next"
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { QRCodeSVG } from 'qrcode.react'
import { FaWallet, FaExchangeAlt, FaHistory, FaCoins, FaNetworkWired, FaPaperPlane, FaArrowDown } from 'react-icons/fa'
import toastImport, { Toaster } from 'react-hot-toast'
import SendEthForm from './SendEthForm.js' // This is the form for sending ETH

const toast = toastImport as any;

// These are the URLs and keys for talking to the Ethereum network and Etherscan
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/45aaa878365644ca80666e00ac968f62';
const ETHERSCAN_API_KEY = 'AGVYCISVRPPSEJDKS59VVV6AW191RKAFNS';
const ETHERSCAN_URLS = {
  mainnet: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api',
}
const NETWORKS = [
  { name: 'Ethereum Mainnet', id: 'mainnet', rpc: 'https://cloudflare-eth.com' },
  { name: 'Sepolia Testnet', id: 'sepolia', rpc: SEPOLIA_RPC },
]

// This is the main App component. It holds all the state and logic for your wallet.
function App({ wallet, setWallet }: { wallet: { wallet: ethers.Wallet | ethers.HDNodeWallet, network: string } | null, setWallet: (w: { wallet: ethers.Wallet | ethers.HDNodeWallet, network: string } | null) => void }) {
  // These are all the pieces of data (state) we keep track of in the app
  // For example: your balance, if you're sending ETH, which network you're on, etc.
  const [balance, setBalance] = useState<string | null>(null)
  const [rawBalance, setRawBalance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendStatus, setSendStatus] = useState<string | null>(null)
  const [network, setNetwork] = useState(wallet?.network || 'sepolia')
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createdMnemonic, setCreatedMnemonic] = useState('');
  const [createdWallet, setCreatedWallet] = useState<any>(null);
  const [showConfirmMnemonic, setShowConfirmMnemonic] = useState(false);
  const [mnemonicConfirm, setMnemonicConfirm] = useState('');
  const [mnemonicError, setMnemonicError] = useState('');
  // New state for tx history and tokens
  const [txHistory, setTxHistory] = useState<any[]>([])
  const [tokenBalances, setTokenBalances] = useState<any[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [mode, setMode] = useState<'mnemonic' | 'privateKey'>('mnemonic')
  const [mnemonic, setMnemonic] = useState('')
  const [privateKey, setPrivateKey] = useState('')

  // This function gives us the right Ethereum provider (connection) for the selected network
  // It switches between Sepolia and Mainnet based on the user's choice
  const getProvider = () => {
    switch (network) {
      case 'sepolia':
        return new ethers.JsonRpcProvider(SEPOLIA_RPC)
      case 'mainnet':
      default:
        return new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
    }
  }

  // This function gets your transaction history from Etherscan
  // It fetches the last 10 transactions for your wallet address
  const fetchTxHistory = async (address: string) => {
    setLoadingTx(true)
    try {
      const url = `${ETHERSCAN_URLS[network as keyof typeof ETHERSCAN_URLS]}?module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === '1') setTxHistory(data.result.slice(0, 10))
      else if (data.message && data.message.toLowerCase().includes('rate limit')) {
        setTxHistory([])
        setError('Etherscan API rate limit reached. Please try again later.')
      } else if (data.result && typeof data.result === 'string' && data.result.toLowerCase().includes('invalid api key')) {
        setTxHistory([])
        setError('Invalid Etherscan API key. Please update your API key.')
      } else {
        setTxHistory([])
        setError('No transactions found or unable to fetch transactions.')
      }
    } catch (e) {
      setTxHistory([])
      setError('Failed to fetch transactions.')
    }
    setLoadingTx(false)
  }

  // This function gets your token balances from Etherscan
  // It shows the tokens you hold in your wallet, like USDT, DAI, etc.
  const fetchTokenBalances = async (address: string) => {
    setLoadingTokens(true)
    try {
      const url = `${ETHERSCAN_URLS[network as keyof typeof ETHERSCAN_URLS]}?module=account&action=tokentx&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === '1') {
        // Group by token contract
        const tokens: any = {}
        data.result.forEach((tx: any) => {
          if (!tokens[tx.contractAddress]) {
            tokens[tx.contractAddress] = {
              symbol: tx.tokenSymbol,
              name: tx.tokenName,
              contract: tx.contractAddress,
              balance: ethers.formatUnits(tx.tokenDecimal === '0' ? tx.value : tx.value, tx.tokenDecimal),
            }
          }
        })
        setTokenBalances(Object.values(tokens))
      } else setTokenBalances([])
    } catch (e) {
      setTokenBalances([])
    }
    setLoadingTokens(false)
  }

  // This useEffect runs when your wallet or network changes, and updates your balances and history
  useEffect(() => {
    if (wallet) {
      fetchBalance(wallet.wallet)
      fetchTxHistory(wallet.wallet.address)
      fetchTokenBalances(wallet.wallet.address)
      // Simulate wallet creation date for demo
      if (!createdAt) setCreatedAt(new Date().toISOString())
    }
    // eslint-disable-next-line
  }, [wallet, network])

  // This function gets your ETH balance using ethers.js
  // It connects to the Ethereum network and fetches the balance for your wallet address
  const fetchBalance = async (w: ethers.Wallet | ethers.HDNodeWallet) => {
    try {
      const provider = getProvider()
      console.log('Fetching balance for address:', w.address, 'on network:', network)
      const bal = await provider.getBalance(w.address)
      setRawBalance(bal.toString())
      console.log('Raw balance (wei):', bal.toString(), 'ETH:', ethers.formatEther(bal))
      setBalance(ethers.formatEther(bal))
    } catch (err: any) {
      setError('Failed to fetch balance')
      console.error('Balance fetch error:', err)
    }
  }

  // This function sends ETH to another address
  // It creates and sends a transaction from your wallet to the recipient's address
  const sendEth = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendStatus(null)
    try {
      if (!wallet) throw new Error('No wallet loaded')
      const provider = getProvider()
      const signer = wallet.wallet.connect(provider)
      const tx = await signer.sendTransaction({ to: sendTo, value: ethers.parseEther(sendAmount) })
      setSendStatus('Transaction sent: ' + tx.hash)
      setSendTo('')
      setSendAmount('')
      fetchBalance(wallet.wallet)
    } catch (err: any) {
      setSendStatus('Error: ' + (err.message || err))
    }
    setSending(false)
  }

  // This function copies your wallet address to the clipboard
  // It uses the browser's clipboard API to copy the address, and shows a success message
  const copyToClipboard = () => {
    if (!wallet?.wallet?.address) return
    navigator.clipboard.writeText(wallet.wallet.address)
      .then(() => {
        setCopied(true)
        toast.success('Wallet address copied to clipboard')
      })
      .catch(() => {
        setError('Failed to copy address')
        toast.error('Failed to copy address')
      })
    setTimeout(() => setCopied(false), 1200)
  }

  // This function lets you import a wallet using a mnemonic or private key
  // It updates the wallet state and switches the network if needed
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let wallet;
      if (mode === 'mnemonic') {
        wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
      } else {
        wallet = new ethers.Wallet(privateKey.trim());
      }
      setWallet({ wallet, network });
    } catch (err: any) {
      setError('Invalid mnemonic or private key');
    }
  }

  if (!wallet) {
    // Hide navigation and all other pages when wallet is not imported
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card container" style={{ maxWidth: 400, background: 'var(--card-bg, #f1f5f9)', color: 'var(--card-text, #232946)', borderRadius: 16, boxShadow: '0 2px 16px #6366f122', textAlign: 'center', padding: '2rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ marginBottom: 16, color: '#3730a3', fontWeight: 700, fontSize: 24, textAlign: 'center' }}>Import Wallet</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center' }}>
            <button
              className={mode === 'mnemonic' ? 'connect-btn import-toggle active' : 'connect-btn import-toggle'}
              style={{ fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '0.5rem 1.5rem', border: 'none', cursor: 'pointer', boxShadow: mode === 'mnemonic' ? '0 2px 8px #6366f155' : 'none', outline: mode === 'mnemonic' ? '2px solid #6366f1' : 'none', background: mode === 'mnemonic' ? '#6366f1' : '#e0e7ff', color: mode === 'mnemonic' ? '#fff' : '#3730a3', transition: 'all 0.15s' }}
              onClick={() => setMode('mnemonic')}
              type="button"
            >
              Mnemonic
            </button>
            <button
              className={mode === 'privateKey' ? 'connect-btn import-toggle active' : 'connect-btn import-toggle'}
              style={{ fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '0.5rem 1.5rem', border: 'none', cursor: 'pointer', boxShadow: mode === 'privateKey' ? '0 2px 8px #6366f155' : 'none', outline: mode === 'privateKey' ? '2px solid #6366f1' : 'none', background: mode === 'privateKey' ? '#6366f1' : '#e0e7ff', color: mode === 'privateKey' ? '#fff' : '#3730a3', transition: 'all 0.15s' }}
              onClick={() => setMode('privateKey')}
              type="button"
            >
              Private Key
            </button>
          </div>
          <form onSubmit={handleImport} style={{ margin: 0 }}>
            {mode === 'mnemonic' ? (
              <textarea
                placeholder="Enter mnemonic phrase"
                value={mnemonic}
                onChange={e => setMnemonic(e.target.value)}
                rows={3}
                style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd', fontSize: 16 }}
                required
              />
            ) : (
              <input
                type="text"
                placeholder="Enter private key"
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
                style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd', fontSize: 16 }}
                required
              />
            )}
            <button type="submit" style={{ width: '100%', background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px #6366f122', transition: 'background 0.2s' }}>Import Wallet</button>
            {error && <div className="error" style={{ color: '#e11d48', marginTop: 10 }}>{error}</div>}
          </form>
          <button
            style={{ width: '100%', background: 'linear-gradient(90deg,#10b981,#60a5fa)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 18, boxShadow: '0 2px 8px #10b98155', transition: 'background 0.2s' }}
            onClick={() => {
              setShowCreate(true);
              // Generate new wallet
              const mnemonic = ethers.Wallet.createRandom().mnemonic?.phrase || '';
              setCreatedMnemonic(mnemonic);
              setCreatedWallet(ethers.Wallet.fromPhrase(mnemonic));
            }}
          >Create a Wallet</button>
          <div className="security-tips card" style={{ maxWidth: 400, marginTop: 24 }}>
            <h3 style={{ marginBottom: 8, textAlign: 'center' }}>Security Tips</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Never share your private key or mnemonic phrase with anyone</li>
              <li>Store your recovery phrase in a secure offline location</li>
              <li>Be cautious of phishing attempts and verify website URLs</li>
            </ul>
          </div>
        </div>
        {/* Create Wallet Modal */}
        {showCreate && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{
              maxWidth: 400,
              background: 'var(--modal-bg, #f1f5f9)', // use a dedicated modal background variable
              color: 'var(--card-text, #232946)',
              borderRadius: 20,
              boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18), 0 2px 16px #6366f122',
              textAlign: 'center',
              padding: '2rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #e0e7ef',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreatedMnemonic('');
                  setCreatedWallet(null);
                }}
                aria-label="Close"
                style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#6366f1', cursor: 'pointer', zIndex: 2, textShadow: '0 2px 8px #23294688' }}
              >
                &times;
              </button>
              <h2 style={{ marginBottom: 16, color: '#3730a3', fontWeight: 700, fontSize: 24, textAlign: 'center' }}>Create New Wallet</h2>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#6366f1' }}>Your new wallet mnemonic:</div>
              <div style={{ background: '#e0e7ff', color: '#232946', borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 17, marginBottom: 16, wordBreak: 'break-word', textAlign: 'center', letterSpacing: 1 }}>{createdMnemonic}</div>
              <div style={{ fontSize: 15, color: '#232946', marginBottom: 16, textAlign: 'center' }}>Please back up your mnemonic securely. Anyone with this phrase can access your wallet.</div>
              <button
                style={{ width: '100%', background: 'linear-gradient(90deg,#10b981,#60a5fa)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px #10b98155', transition: 'background 0.2s' }}
                onClick={() => {
                  setShowCreate(false);
                  setShowConfirmMnemonic(true);
                  setMnemonicConfirm('');
                  setMnemonicError('');
                }}
              >Continue</button>
              <button
                className="secondary"
                style={{ width: '100%', background: 'var(--card-bg, #f8fafc)', color: 'var(--card-text, #232946)', border: '1.5px solid #e0e7ef', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 10, boxShadow: '0 2px 8px #6366f122', transition: 'background 0.2s' }}
                onClick={() => {
                  setShowCreate(false);
                  setCreatedMnemonic('');
                  setCreatedWallet(null);
                }}
              >Cancel</button>
            </div>
          </div>
        )}
        {showConfirmMnemonic && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{
              maxWidth: 400,
              background: 'var(--modal-bg, #f1f5f9)', // use a dedicated modal background variable
              color: 'var(--card-text, #232946)',
              borderRadius: 20,
              boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18), 0 2px 16px #6366f122',
              textAlign: 'center',
              padding: '2rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #e0e7ef',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmMnemonic(false);
                  setCreatedMnemonic('');
                  setCreatedWallet(null);
                  setMnemonicConfirm('');
                  setMnemonicError('');
                }}
                aria-label="Close"
                style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#6366f1', cursor: 'pointer', zIndex: 2, textShadow: '0 2px 8px #23294688' }}
              >
                &times;
              </button>
              <h2 style={{ marginBottom: 16, color: '#3730a3', fontWeight: 700, fontSize: 22, textAlign: 'center' }}>Confirm Your Mnemonic</h2>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#6366f1' }}>Please re-enter your mnemonic phrase to continue:</div>
              <textarea
                placeholder="Re-enter mnemonic phrase"
                value={mnemonicConfirm}
                onChange={e => {
                  setMnemonicConfirm(e.target.value);
                  setMnemonicError('');
                }}
                rows={2}
                style={{ width: '100%', marginBottom: 8, borderRadius: 8, padding: 10, border: '1px solid #ddd', fontSize: 16 }}
              />
              {mnemonicError && <div style={{ color: '#fee2e2', background: '#e11d48', borderRadius: 8, padding: '6px 10px', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>{mnemonicError}</div>}
              <button
                style={{ width: '100%', background: 'linear-gradient(90deg,#10b981,#60a5fa)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px #10b98155', transition: 'background 0.2s' }}
                disabled={mnemonicConfirm.trim() === ''}
                onClick={() => {
                  if (mnemonicConfirm.trim() !== createdMnemonic.trim()) {
                    setMnemonicError('Mnemonic does not match. Please try again.');
                    return;
                  }
                  setWallet({ wallet: createdWallet, network });
                  setShowConfirmMnemonic(false);
                  setCreatedMnemonic('');
                  setCreatedWallet(null);
                  setMnemonicConfirm('');
                  setMnemonicError('');
                }}
              >Continue to Wallet</button>
              <button
                style={{ width: '100%', background: '#e0e7ff', color: '#232946', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 10, boxShadow: '0 2px 8px #6366f122', transition: 'background 0.2s' }}
                onClick={() => {
                  setShowConfirmMnemonic(false);
                  setCreatedMnemonic('');
                  setCreatedWallet(null);
                  setMnemonicConfirm('');
                  setMnemonicError('');
                }}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Network selector UI in wallet section
  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value)
    setWallet({ wallet: wallet.wallet, network: e.target.value })
  }

  // The return below is the main UI for the app. It shows your dashboard, modals, and all the buttons.
  return (
    <div className="main-app-container">
      {/* Header */}
      {/* Wallet Header Card with Network info and Change button inside */}
      <div className="card" style={{
        background: 'linear-gradient(90deg,#6366f1,#60a5fa)',
        color: '#fff',
        borderRadius: 16,
        marginBottom: 32,
        boxShadow: '0 2px 12px #6366f122',
        padding: '18px 32px',
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <FaWallet size={32} />
          Ethereum Wallet
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18 }}>
          <span style={{ fontWeight: 600, color: '#e0e7ff', fontSize: 17 }}>Network:</span>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 17 }}>{NETWORKS.find(n => n.id === network)?.name}</span>
          <button
            className="quick-action"
            style={{
              background: 'linear-gradient(90deg,#ede9fe,#a5b4fc)',
              color: '#3730a3',
              border: 'none',
              borderRadius: 12,
              padding: '8px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 2px 8px #a5b4fc22',
              marginLeft: 10,
              transition: 'background 0.2s',
            }}
            onClick={() => setShowNetworkModal(true)}
          >
            Change Network
          </button>
        </span>
      </div>
      {/* Summary Cards Row - Balance and Tokens side by side */}
      <div className="dashboard-summary mb-8" style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'stretch',
      }}>
        <div className="dashboard-summary-card gradient-success shadow" style={{ minWidth: 180, flex: 1, maxWidth: 340, color: '#fff', display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(90deg,#10b981,#06b6d4)', height: '100%', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
          <span style={{ color: '#fff', fontSize: 32, marginBottom: 8 }}><FaExchangeAlt /></span>
          <h3 className="balance-label" style={{ color: '#d1fae5', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Balance</h3>
          <div className="balance" style={{ color: '#fff', fontWeight: 700, fontSize: 22, textAlign: 'center' }}>{balance !== null ? `${parseFloat(balance).toFixed(6)} ETH` : '--'}</div>
          {network === 'sepolia' && rawBalance !== null && (
            <div className="text-xs" style={{ color: '#e0e7ff', marginTop: 4, textAlign: 'center' }}>Raw Sepolia balance (wei): {rawBalance}</div>
          )}
          {network === 'sepolia' && balance === '0.0' && (
            <div className="text-xs" style={{ color: '#fee2e2', marginTop: 4, textAlign: 'center' }}>Warning: Sepolia balance is zero. If you expect funds, check your address and RPC status.</div>
          )}
        </div>
        <div className="dashboard-summary-card gradient-warning shadow" style={{ minWidth: 220, flex: 1, maxWidth: 340, color: '#fff', display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(90deg,#f59e42,#fbbf24)', height: '100%', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
          <span style={{ color: '#fff', fontSize: 28, marginBottom: 8 }}><FaCoins /></span>
          <h3 className="balance-label" style={{ color: '#fef3c7', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Tokens</h3>
          {loadingTokens ? (
            <div style={{ color: '#fff', textAlign: 'center' }}>Loading tokens...</div>
          ) : tokenBalances.length === 0 ? (
            <ul style={{ fontSize: 14, margin: 0, padding: 0, textAlign: 'center', listStyle: 'none' }}>
              <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', color: '#fff', justifyContent: 'center' }}>
                <span style={{ color: '#6366f1', fontSize: 16, marginRight: 6 }}><FaCoins /></span>
                <b>ETH</b>: {balance !== null ? parseFloat(balance).toFixed(4) : '--'}
              </li>
            </ul>
          ) : (
            <ul style={{ fontSize: 14, margin: 0, padding: 0, textAlign: 'center', listStyle: 'none' }}>
              <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', color: '#fff', justifyContent: 'center' }}>
                <span style={{ color: '#6366f1', fontSize: 16, marginRight: 6 }}><FaCoins /></span>
                <b>ETH</b>: {balance !== null ? parseFloat(balance).toFixed(4) : '--'}
              </li>
              {tokenBalances.map((t) => (
                <li key={t.contract} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', color: '#fff', justifyContent: 'center' }}>
                  <span style={{ color: '#f59e42', fontSize: 16, marginRight: 6 }}><FaCoins /></span>
                  <b>{t.symbol}</b>: {parseFloat(t.balance).toFixed(4)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Quick Actions: Send / Receive - now above the divider and Recent Transactions */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '2.5rem 0 0 0', justifyContent: 'center' }}>
        <button className="quick-action" style={{ flex: '1 1 0%', minWidth: 120, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', color: '#fff', border: 'none', borderRadius: 12, padding: 18, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, boxShadow: '0 2px 8px #6366f122' }} onClick={() => setShowSend(true)}><FaPaperPlane />Send</button>
        <button className="quick-action" style={{ flex: '1 1 0%', minWidth: 120, background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', border: 'none', borderRadius: 12, padding: 18, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, boxShadow: '0 2px 8px #10b98122' }} onClick={() => setShowReceive(true)}><FaArrowDown />Receive</button>
      </div>
      {/* Divider - above Recent Transactions */}
      <div style={{ width: '100%', height: 2, background: 'linear-gradient(90deg,#ede9fe,#a5b4fc,#10b981,#06b6d4,#f59e42,#fbbf24)', borderRadius: 2, margin: '2.5rem 0 2rem 0' }} />
      {/* Centered Transactions Card */}
      <div style={{ maxWidth: 700, minHeight: 220, margin: '0 auto', marginBottom: 32, borderRadius: 20, color: '#fff', padding: 0, textAlign: 'center', background: 'linear-gradient(90deg,#6366f1,#60a5fa)', boxShadow: '0 2px 12px #6366f122' }}>
        <div className="flex items-center mb-2" style={{ justifyContent: 'center', padding: '28px 0 0 0' }}><span style={{ color: '#fff', fontSize: 20, marginRight: 10 }}><FaHistory /></span> <b>Recent Transactions</b>
          <button
            onClick={() => wallet && fetchTxHistory(wallet.wallet.address)}
            style={{ marginLeft: 18, background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 10, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px #6366f111' }}
            disabled={loadingTx}
          >{loadingTx ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        <div style={{ padding: 32 }}>
        {loadingTx ? <div>Loading transactions...</div> : error ? <div style={{ color: '#fee2e2' }}>{error}</div> : txHistory.length === 0 ? <div className="text-xs" style={{ color: '#e0e7ff' }}>No transactions found</div> : (
          <ul style={{ fontSize: 15, margin: 0, padding: 0, textAlign: 'left' }}>
            {txHistory.map((tx) => {
              let statusColor = tx.isError === '1' ? '#ef4444' : '#10b981';
              return (
                <li key={tx.hash} style={{ marginBottom: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', color: '#fff' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColor, marginRight: 8 }} title={tx.isError === '1' ? 'Failed' : 'Success'}></span>
                  <span style={{ color: '#e0e7ff', marginRight: 6 }}>{tx.value && ethers.formatEther(tx.value)} ETH</span> to <span style={{ margin: '0 6px' }}>{tx.to}</span> <span className="text-xs" style={{ color: '#c7d2fe' }}>{new Date(Number(tx.timeStamp) * 1000).toLocaleString()}</span>
                  <div style={{ fontSize: 12, marginLeft: 8 }}><a href={`https://${network === 'mainnet' ? '' : network + '.'}etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ede9fe' }}>View</a></div>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </div>
      {/* Security Tips Card (now unified style) */}
      <div className="security-tips card">
        <h3 style={{ marginBottom: 8, textAlign: 'center' }}>Security Tips</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Never share your private key or mnemonic phrase with anyone</li>
          <li>Store your recovery phrase in a secure offline location</li>
          <li>Be cautious of phishing attempts and verify website URLs</li>
        </ul>
      </div>
      {/* Network Change Modal (remains outside main card for overlay) */}
      {showNetworkModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="card network-modal"
            style={{
              background: 'linear-gradient(120deg,#6366f1 0%,#60a5fa 60%,#10b981 100%)',
              borderRadius: 20,
              padding: '1.2rem 1.2rem 1.5rem 1.2rem',
              minWidth: 0,
              width: '95vw',
              maxWidth: 400,
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto',
              maxHeight: '90vh',
            }}
          >
            <button onClick={() => setShowNetworkModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginBottom: 18, textAlign: 'center', color: '#3730a3', fontWeight: 700, fontSize: 20 }}>Change Network</h3>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="network-select" style={{ fontWeight: 600, color: '#6366f1', marginBottom: 6, display: 'block' }}>Select Network</label>
              <select
                id="network-select"
                value={network}
                onChange={e => setNetwork(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #a5b4fc', fontSize: 16, marginBottom: 12 }}
              >
                {NETWORKS.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setWallet({ wallet: wallet.wallet, network });
                setShowNetworkModal(false);
                toast.success('Network changed to ' + NETWORKS.find(n => n.id === network)?.name);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg,#6366f1,#60a5fa)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 8,
                boxShadow: '0 2px 8px #6366f122',
                transition: 'background 0.2s',
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      {/* Send Modal */}
      {showSend && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SendEthForm provider={getProvider()} wallet={wallet.wallet} onClose={() => setShowSend(false)} />
        </div>
      )}
      {/* Receive Modal */}
      {showReceive && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(120deg,#6366f1 0%,#60a5fa 60%,#10b981 100%)',
              borderRadius: 20,
              padding: 0,
              minWidth: 340,
              maxWidth: 420,
              boxShadow: '0 8px 32px 0 rgba(99,102,241,0.25), 0 2px 16px #10b98133',
              position: 'relative',
              textAlign: 'center',
              border: '3px solid #fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button onClick={() => setShowReceive(false)} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#fff', cursor: 'pointer', zIndex: 2, textShadow: '0 1px 8px #23294644' }}>&times;</button>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 18, marginTop: 32, color: '#fff', letterSpacing: 1, textShadow: '0 2px 12px #23294644' }}>Receive ETH</h3>
            <div style={{ fontSize: 15, color: '#e0e7ff', marginBottom: 10, fontWeight: 500 }}>Your Address:</div>
            <div style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 12,
              padding: 14,
              wordBreak: 'break-all',
              marginBottom: 18,
              fontSize: 16,
              fontWeight: 700,
              color: '#232946',
              boxShadow: '0 2px 12px #fff4',
              border: '1.5px solid #e0e7ff',
              backdropFilter: 'blur(4px)',
              maxWidth: 320,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>{wallet.wallet.address}</div>
            <div className="qr-section" style={{ textAlign: 'center', width: '100%', marginBottom: 10 }}>
              {wallet.wallet.address && <QRCodeSVG value={wallet.wallet.address} size={96} className="mx-auto" />}
              <div className="qr-caption" style={{ color: '#e0e7ff', marginTop: 8, fontSize: 14, fontWeight: 500, textShadow: '0 1px 8px #23294644' }}>Scan to share</div>
            </div>
            <button
              onClick={() => {navigator.clipboard.writeText(wallet.wallet.address || '');}}
              style={{
                background: 'linear-gradient(90deg,#10b981,#60a5fa)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#fff',
                fontSize: 16,
                marginTop: 10,
                marginBottom: 32,
                boxShadow: '0 2px 8px #10b98155',
                letterSpacing: 0.5,
                transition: 'background 0.18s',
                textShadow: '0 1px 8px #23294644',
              }}
            >Copy Address</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

/* Add keyframes for modalFadeIn and modalGradientMove in your CSS: */
// @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
// @keyframes modalGradientMove { from { background-position: 80% 90%; } to { background-position: 60% 80%; } }
