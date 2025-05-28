// WalletConnectButton.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

interface Props {
  onImport: (wallet: ethers.Wallet | ethers.HDNodeWallet) => void;
}

const WalletConnectButton: React.FC<Props> = ({ onImport }) => {
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'mnemonic' | 'privateKey'>('mnemonic');

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
      onImport(wallet);
    } catch (err: any) {
      setError('Invalid mnemonic or private key');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>Import Wallet</h2>
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
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default WalletConnectButton;
