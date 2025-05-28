// SendEthForm.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

interface Props {
  provider: ethers.JsonRpcProvider | null;
  wallet: ethers.Wallet | ethers.HDNodeWallet | null;
  onClose?: () => void;
}

const SendEthForm: React.FC<Props> = ({ provider, wallet, onClose }) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSending(true);
    try {
      if (!provider || !wallet) throw new Error('No wallet loaded');
      const signer = wallet.connect(provider);
      const tx = await signer.sendTransaction({ to, value: ethers.parseEther(amount) });
      setStatus('Transaction sent: ' + tx.hash);
      setTo('');
      setAmount('');
    } catch (err: any) {
      setStatus('Error: ' + (err.message || err));
    }
    setSending(false);
  };

  return (
    <form
      onSubmit={handleSend}
      className="card send-eth-form-card"
      style={{
        background: 'linear-gradient(120deg,#6366f1 0%,#60a5fa 60%,#10b981 100%)',
        borderRadius: 20,
        boxShadow: '0 8px 32px 0 rgba(99,102,241,0.25), 0 2px 16px #10b98133',
        padding: '2rem 1.5rem',
        minWidth: 300,
        maxWidth: 400,
        margin: '0 auto',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 18,
        border: '3px solid #fff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 18,
            background: 'none',
            border: 'none',
            fontSize: 26,
            color: '#fff',
            cursor: 'pointer',
            zIndex: 2,
            textShadow: '0 2px 8px #23294688',
          }}
        >
          &times;
        </button>
      )}
      <h2 style={{
        textAlign: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: 22,
        margin: 0,
        marginBottom: 8,
        letterSpacing: 0.5,
        textShadow: '0 2px 12px #23294688',
      }}>Send ETH</h2>
      <div style={{ height: 2, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', borderRadius: 2, marginBottom: 12, opacity: 0.12 }} />
      <input
        type="text"
        placeholder="Recipient address"
        value={to}
        onChange={e => setTo(e.target.value)}
        required
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: '1.5px solid #e0e7ff',
          fontSize: 16,
          outline: 'none',
          background: 'rgba(255,255,255,0.18)',
          color: '#232946',
          boxShadow: '0 1px 4px #fff4',
          transition: 'border 0.2s',
          fontWeight: 600,
        }}
      />
      <input
        type="number"
        placeholder="Amount (ETH)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        min="0"
        step="any"
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: '1.5px solid #e0e7ff',
          fontSize: 16,
          outline: 'none',
          background: 'rgba(255,255,255,0.18)',
          color: '#232946',
          boxShadow: '0 1px 4px #fff4',
          transition: 'border 0.2s',
          fontWeight: 600,
        }}
      />
      <button
        type="submit"
        disabled={sending}
        style={{
          background: 'linear-gradient(90deg,#10b981,#60a5fa)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '12px 0',
          fontWeight: 700,
          fontSize: 17,
          cursor: sending ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px #10b98155',
          transition: 'background 0.2s',
          marginTop: 4,
          letterSpacing: 0.5,
          textShadow: '0 1px 8px #23294644',
        }}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
      {status && (
        <div
          style={{
            marginTop: 8,
            color: status.startsWith('Error') ? '#e11d48' : '#10b981',
            background: status.startsWith('Error') ? '#fee2e2' : '#d1fae5',
            borderRadius: 8,
            padding: '8px 12px',
            fontWeight: 600,
            textAlign: 'center',
            fontSize: 15,
            boxShadow: '0 1px 4px #6366f111',
          }}
        >
          {status}
        </div>
      )}
    </form>
  );
};

export default SendEthForm;
