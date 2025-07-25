# Ethereum Wallet Lite

A beginner-friendly, modern Ethereum wallet frontend built with React, Vite, and TypeScript. Designed for students and new developers to learn about Ethereum wallets, blockchain basics, and web3 app development.

## Features
- Modern React (with hooks and functional components)
- TypeScript for type safety and clarity
- Import or create Emthereu wallets (mnemonic or private key)
- Enforced mnemonic backup and confirmation for security
- View ETH balance, token balances, and recent transactions
- Send and receive ETH with a simple UI
- Light/dark mode toggle
- Live ETH price and market insights (with AI-powered predictions)
- No server-side storage of sensitive data

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the development server:**
   ```sh
   npm run dev
   ```
3. **Open your browser:**
   Visit [http://localhost:5173](http://localhost:5173) to view the app.

## Project Structure
- `src/` — Main source code (React components, styles, logic)
- `api/` — Mock and proxy API endpoints (for Etherscan, market data, etc.)
- `public/` — Static assets (icons, images)
- `index.html` — Main HTML entry point

## How It Works
- **Onboarding:** Users must import or create a wallet. If creating, they are shown a mnemonic and must confirm it before using the app.
- **State Management:** All flows (onboarding, sending, etc.) are managed with React state and conditional rendering for simplicity and reliability.
- **Security:** Mnemonics and private keys are never sent to a server. All sensitive operations happen in the browser.


This project was scaffolded with [Vite](https://vitejs.dev/) and the React + TypeScript template.

