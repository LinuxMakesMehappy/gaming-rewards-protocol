# Gaming Rewards Protocol

A Solana-based memecoin protocol backed by staked SOL, distributing 50% of yields to verified gamers via oracles, with 50% to treasury. Built with Anchor for smart contracts and Node.js for off-chain bots.

## 🎮 Features

- **Staked SOL Backing**: Protocol backed by staked SOL for yield generation
- **50/50 Yield Distribution**: 50% to verified gamers, 50% to treasury
- **Oracle Verification**: Ed25519 signature verification for gaming achievements
- **Steam Integration**: Real-time achievement detection via Steam API
- **Rate Limiting**: 1-hour harvest intervals, 24-hour claim intervals
- **Security**: Input validation, access controls, and oracle slashing

## 🏗️ Architecture

```
├── contracts/          # Anchor smart contracts (Rust)
├── bots/              # Node.js off-chain workers (TypeScript)
├── tests/             # Integration and e2e tests
└── docs/              # Documentation and specifications
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust toolchain
- Anchor CLI
- Solana CLI

### Installation

1. **Install Dependencies**
   ```bash
   # Install Rust and Solana
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   
   # Install Anchor CLI
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   
   # Install Node.js dependencies
   npm install
   cd bots && npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your keys and RPC endpoints
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

## 🔐 Security Features

- **Input Sanitization**: All user inputs validated
- **Access Controls**: Owner and oracle-only operations
- **Reentrancy Protection**: Checks against overdraw attacks
- **Multi-Sig Treasury**: Squads integration for secure fund management
- **Oracle Consensus**: Multiple oracle verification for achievements
- **Rate Limiting**: Bot protection against spam

## 📊 Smart Contract Accounts

### TreasuryAccount
- `owner`: Treasury owner address
- `last_harvest`: Last harvest timestamp
- `user_rewards_pool`: USDC rewards pool for gamers
- `stake_account`: SOL stake account for yield generation

### UserRewardAccount
- `user`: User's wallet address
- `last_claim`: Last claim timestamp
- `total_claimed`: Total amount claimed by user

### OracleAccount
- `stake`: Oracle stake amount for verification

## 🤖 Off-Chain Components

### Yield Harvesting Bot
- Monitors stake yields every hour
- Calculates yield amounts and 50/50 split
- Executes harvest_and_rebalance transactions
- Integrates with Jupiter for SOL to USDC swaps

### Game Event Detection
- Polls Steam API for achievements every 5 minutes
- Maps verified gamers to wallet addresses
- Creates Ed25519 oracle signatures
- Stores signatures for on-chain verification

## 🧪 Testing

```bash
# Run all tests
npm test

# Contract tests only
npm run test:contracts

# Bot tests only
npm run test:bots

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

```bash
# Build contracts
npm run build

# Deploy to Devnet
npm run deploy:devnet

# Deploy to Mainnet
npm run deploy:mainnet

# Start bot
npm run bot
```

## 📈 Monitoring

- Failed transaction alerts
- Low balance notifications
- Oracle consensus monitoring
- Bot health checks

## 🔍 Security Audit

This project includes:
- Automated security checks
- Manual penetration testing
- Solana verifier tools
- External audit recommendations

## 📄 License

MIT License - see LICENSE file for details 