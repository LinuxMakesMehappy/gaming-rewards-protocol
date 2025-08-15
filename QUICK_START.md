# Gaming Rewards Protocol - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run the Gaming Rewards Protocol locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Solana CLI** (v1.17 or higher)
- **Anchor CLI** (latest)

### Install Prerequisites

#### Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

#### Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

#### Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

#### Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## Quick Setup

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd gaming-rewards-protocol

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment
```bash
# Edit the environment file
cp env.example .env
nano .env  # or use your preferred editor
```

**Required API Keys:**
- `STEAM_API_KEY` - Get from [Steam Developer](https://steamcommunity.com/dev/apikey)
- `JUPITER_API_KEY` - Get from [Jupiter](https://station.jup.ag/)

### 3. Start Development
```bash
# Start the development server
npm run dev

# The interface will be available at http://localhost:3000
```

## Project Structure

```
gaming-rewards-protocol/
├── core/                 # Core business logic
│   ├── jupiter-integration/  # Jupiter swap integration
│   ├── steam-validation/     # Steam API integration
│   └── security-manager/     # Security and fraud detection
├── contracts/            # Solana smart contracts
│   └── programs/
│       └── gaming-rewards-protocol/
├── validation/           # Validation system
│   ├── steam-api/        # Steam API client
│   ├── fraud-detection/  # Fraud detection system
│   └── oracle-system/    # Oracle verification
└── interface/            # React/Next.js UI
    ├── components/       # React components
    ├── hooks/           # Custom React hooks
    └── pages/           # Next.js pages
```

## Development Commands

### Build
```bash
# Build all modules
npm run build

# Build specific module
npm run build:core
npm run build:contracts
npm run build:validation
npm run build:interface
```

### Test
```bash
# Run all tests
npm test

# Run security tests
npm run test:security

# Run specific tests
npm run test:core
npm run test:contracts
```

### Deploy
```bash
# Deploy to devnet
npm run deploy:devnet

# Deploy to mainnet (production)
npm run deploy:mainnet
```

## Testing the Protocol

### 1. Connect Wallet
- Open http://localhost:3000
- Click "Connect Wallet" and connect your Solana wallet
- Make sure you're on devnet

### 2. Authenticate with Steam
- Click "Authenticate with Steam"
- Enter a valid Steam ID (17 digits)
- Or use the Steam OpenID login

### 3. View Achievements
- Browse your Steam achievements
- Filter by claimed/unclaimed status
- Sort by date, rarity, or name

### 4. Claim Rewards
- Click "Claim Reward" on unclaimed achievements
- Confirm the transaction in your wallet
- View your earned rewards

### 5. Stake Rewards
- Navigate to the Staking section
- Choose amount and lock period
- Earn additional rewards through staking

## Troubleshooting

### Common Issues

#### "Node.js version too old"
```bash
# Update Node.js
nvm install 18
nvm use 18
```

#### "Solana CLI not found"
```bash
# Add Solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

#### "Anchor build failed"
```bash
# Update Anchor
avm install latest
avm use latest
```

#### "Steam API errors"
- Verify your Steam API key is correct
- Check if the Steam ID is valid (17 digits)
- Ensure the Steam profile is public

#### "Jupiter swap failed"
- Check your Solana wallet has SOL for fees
- Verify you're connected to the correct network (devnet/mainnet)
- Check Jupiter API key configuration

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run dev

# View detailed logs
tail -f logs/gaming-rewards.log
```

## Security Features

### Zero-CVE Policy
- All dependencies are audited for vulnerabilities
- Security scans run automatically on build
- No known CVEs in any dependencies

### Fraud Detection
- Multi-layer fraud detection system
- Pattern recognition for suspicious activity
- Rate limiting and IP blacklisting
- Achievement validation and verification

### Access Control
- Multi-factor authentication
- Role-based access control
- Complete audit logging
- Session management

## Next Steps

### For Developers
1. **Read the Documentation**
   - Check `README.md` for detailed architecture
   - Review `IMPLEMENTATION_SUMMARY.md` for component details

2. **Explore the Codebase**
   - Start with `core/src/index.ts` for main logic
   - Review smart contracts in `contracts/programs/`
   - Check UI components in `interface/src/components/`

3. **Run Tests**
   - Execute `npm test` to run all tests
   - Review test coverage and add new tests

4. **Contribute**
   - Follow the security-first development approach
   - Maintain zero-CVE policy
   - Add comprehensive tests for new features

### For Production
1. **Security Audit**
   - Conduct comprehensive security review
   - Run penetration testing
   - Verify all security measures

2. **Performance Optimization**
   - Optimize smart contract gas usage
   - Improve API response times
   - Add caching layers

3. **Monitoring**
   - Set up logging and monitoring
   - Configure alerts for suspicious activity
   - Implement backup and recovery procedures

## Support

- **Documentation**: Check the README and implementation guides
- **Issues**: Create an issue in the repository
- **Security**: Report security issues to security@gamingrewards.io

## License

MIT License - See LICENSE file for details

---

**Remember**: This is a development version. For production use, ensure all security measures are properly configured and tested.
