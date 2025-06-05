// This file lets users import their Ethereum wallet using a mnemonic phrase or private key.
// It shows a simple form and buttons to switch between the two import methods.

import React, { useState } from 'react';
import { ethers } from 'ethers';

interface Props {
  // This function is called when a wallet is successfully imported
  onImport: (wallet: ethers.Wallet | ethers.HDNodeWallet) => void;
}

const WalletConnectButton: React.FC<Props> = ({ onImport }) => {
  // These keep track of what the user types in the form
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  // This lets the user choose between importing with a mnemonic or a private key
  const [mode, setMode] = useState<'mnemonic' | 'privateKey'>('mnemonic');

  // This function runs when the user submits the form to import their wallet
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let wallet;
      if (mode === 'mnemonic') {
        // If using mnemonic, create wallet from phrase
        wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
      } else {
        // If using private key, create wallet from key
        wallet = new ethers.Wallet(privateKey.trim());
      }
      onImport(wallet);
    } catch (err: any) {
      // Show an error if the input is invalid
      setError('Invalid mnemonic or private key');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>Import Wallet</h2>
      {/* Buttons to switch between mnemonic and private key mode */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center' }}>
        <button
          className={mode === 'mnemonic' ? 'connect-btn' : ''}
          style={{ background: mode === 'mnemonic' ? '#6366f1' : '#e0e7ff', color: mode === 'mnemonic' ? '#fff' : '#3730a3' }}
          onClick={() => setMode('mnemonic')}
        >
          Mnemonic
        </button>
        <button
          className={mode === 'privateKey' ? 'connect-btn' : ''}
          style={{ background: mode === 'privateKey' ? '#6366f1' : '#e0e7ff', color: mode === 'privateKey' ? '#fff' : '#3730a3' }}
          onClick={() => setMode('privateKey')}
        >
          Private Key
        </button>
      </div>
      {/* Show the right input field depending on the selected mode */}
      <form onSubmit={handleImport}>
        {mode === 'mnemonic' ? (
          <textarea
            placeholder="Enter mnemonic phrase"
            value={mnemonic}
            onChange={e => setMnemonic(e.target.value)}
            rows={3}
            style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 8, border: '1px solid #ddd' }}
            required
          />
        ) : (
          <input
            type="text"
            placeholder="Enter private key"
            value={privateKey}
            onChange={e => setPrivateKey(e.target.value)}
            style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 8, border: '1px solid #ddd' }}
            required
          />
        )}
        <button className="connect-btn" type="submit" style={{ width: '100%' }}>Import</button>
        {/* Show an error message if the input is invalid */}
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default WalletConnectButton;
